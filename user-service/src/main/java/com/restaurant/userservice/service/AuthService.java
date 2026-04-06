package com.restaurant.userservice.service;

import com.restaurant.userservice.dto.AuthResponse;
import com.restaurant.userservice.dto.LoginRequest;
import com.restaurant.userservice.dto.RegisterRequest;
import com.restaurant.userservice.entity.EmailVerificationOtpLog;
import com.restaurant.userservice.entity.Role;
import com.restaurant.userservice.entity.User;
import com.restaurant.userservice.repository.EmailVerificationOtpLogRepository;
import com.restaurant.userservice.repository.RoleRepository;
import com.restaurant.userservice.repository.UserRepository;
import com.restaurant.userservice.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final String CUSTOMER_ROLE_NAME = "CUSTOMER";
    private static final String GENERIC_REGISTER_LOG =
            "Register request suppressed to avoid enumeration: identifier={} phone={} reason={}";
    private static final String GENERIC_REGISTER_REJECT_MESSAGE =
        "Không thể gửi OTP với thông tin đã nhập. Vui lòng kiểm tra lại email hoặc số điện thoại.";
    private static final Pattern EMAIL_REGEX =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final UserRepository userRepository;
    private final EmailVerificationOtpLogRepository otpLogRepository;
    private final RoleRepository roleRepository;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final EmailService emailService;

    // -------------------------------------------------------
    // Login — chấp nhận email / số điện thoại / username
    // -------------------------------------------------------
    public AuthResponse login(LoginRequest request) {
        String id = request.getIdentifier().trim();
        Optional<User> optionalUser = resolveUser(id);

        if (optionalUser.isEmpty()) {
            throw new RuntimeException("Thông tin đăng nhập không đúng");
        }

        User user = optionalUser.get();

        // Nếu là CUSTOMER, bắt buộc phải xác thực email bằng OTP
        if (CUSTOMER_ROLE_NAME.equals(user.getRole().getName()) && !user.isEmailVerified()) {
            throw new RuntimeException("Email chưa được xác thực. Vui lòng nhập mã OTP đã gửi về email.");
        }

        if (!verifyPassword(request.getPassword(), user)) {
            throw new RuntimeException("Thông tin đăng nhập không đúng");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().getId());
        return new AuthResponse(userService.mapToDto(user), token);
    }

    // -------------------------------------------------------
    // Register — chỉ dành cho CUSTOMER tự đăng ký
    // -------------------------------------------------------
    @Transactional
    public void register(RegisterRequest request) {
        log.info("Register request: identifier={}, fullName={}", request.getIdentifier(), request.getFullName());
        
        String identifier = request.getIdentifier().trim();
        boolean isEmail = EMAIL_REGEX.matcher(identifier).matches();
        String phoneNumber = request.getPhoneNumber() == null ? "" : request.getPhoneNumber().trim().replaceAll("[^0-9]", "");
        log.debug("Identifier is email: {}", isEmail);

        if (!isEmail) {
            throw new RuntimeException("Vui lòng dùng email để đăng ký. OTP chỉ gửi qua email, không gửi qua số điện thoại.");
        }

        if (isEmail) {
            if (phoneNumber.isBlank()) {
                throw new RuntimeException("Vui lòng nhập số điện thoại");
            }
            if (phoneNumber.length() < 9 || phoneNumber.length() > 11) {
                throw new RuntimeException("Số điện thoại không hợp lệ (9-11 chữ số)");
            }
            List<User> existingByPhone = userRepository.findAllByPhoneNumber(phoneNumber);

            // Nếu email đã tồn tại nhưng CHƯA xác thực → gửi lại OTP (không báo lỗi)
            Optional<User> existingOpt = userRepository.findByEmail(identifier);
            if (existingOpt.isPresent()) {
                User existing = existingOpt.get();
                boolean phoneUsedByAnotherAccount = existingByPhone.stream()
                        .anyMatch(u -> !u.getId().equals(existing.getId()));
                if (phoneUsedByAnotherAccount) {
                    log.info(GENERIC_REGISTER_LOG, identifier, phoneNumber, "phone_conflict_with_other_account");
                    throw new RuntimeException(GENERIC_REGISTER_REJECT_MESSAGE);
                }
                if (existing.isEmailVerified()) {
                    log.info(GENERIC_REGISTER_LOG, identifier, phoneNumber, "email_already_verified");
                    throw new RuntimeException(GENERIC_REGISTER_REJECT_MESSAGE);
                }
                // Cập nhật password + tên mới + OTP mới rồi gửi lại
                existing.setPassword(BCrypt.hashpw(request.getPassword(), BCrypt.gensalt(10)));
                existing.setFullName(request.getFullName().trim());
                existing.setPhoneNumber(phoneNumber);
                String newOtp = generateOtp();
                userRepository.save(existing);
                createOtpLog(existing, identifier, newOtp);
                log.info("Re-sent OTP for unverified email {}: {}", identifier, newOtp);
                emailService.sendOtpEmail(identifier, request.getFullName().trim(), newOtp);
                return;
            }

            if (!existingByPhone.isEmpty()) {
                log.info(GENERIC_REGISTER_LOG, identifier, phoneNumber, "phone_already_registered");
                throw new RuntimeException(GENERIC_REGISTER_REJECT_MESSAGE);
            }
        }

        Role customerRole = roleRepository.findByName(CUSTOMER_ROLE_NAME)
                .orElseThrow(() -> new RuntimeException("Role CUSTOMER chưa được khởi tạo trong DB. Hãy chạy migration."));

        String username = generateUsername(isEmail, identifier);

        User user = new User();
        user.setUsername(username);
        user.setPassword(BCrypt.hashpw(request.getPassword(), BCrypt.gensalt(10)));
        user.setRole(customerRole);
        user.setFullName(request.getFullName().trim());
        user.setEmailVerified(false);

        user.setEmail(identifier);
        user.setPhoneNumber(phoneNumber);

        // Tạo OTP 6 chữ số cho đăng ký bằng email
        String otp = generateOtp();
        log.info("Generated OTP for {}: {}", identifier, otp);

        userRepository.save(user);
        createOtpLog(user, identifier, otp);

        // Gửi email xác thực OTP
        emailService.sendOtpEmail(identifier, request.getFullName().trim(), otp);
    }

    // -------------------------------------------------------
    // Xác thực email qua token (legacy —  giữ lại cho backward compatibility)
    // -------------------------------------------------------
    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Token xác thực không hợp lệ hoặc đã hết hạn"));

        if (user.getEmailVerificationExpiresAt() == null
                || user.getEmailVerificationExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token xác thực đã hết hạn. Vui lòng đăng ký lại.");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiresAt(null);
        userRepository.save(user);
    }

    /**
     * Xác thực email qua OTP 6 chữ số.
     * @param email Email người dùng  
     * @param otp OTP 6 chữ số từ email
     */
    @Transactional
    public void verifyEmailOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));

        EmailVerificationOtpLog otpLog = otpLogRepository
                .findTopByEmailAndValidTrueAndUsedFalseOrderBySentAtDescIdDesc(email)
                .orElseThrow(() -> new RuntimeException("OTP không hợp lệ"));

        otpLog.setLastAttemptAt(LocalDateTime.now());

        if (!otpLog.getOtpCode().equals(otp)) {
            otpLog.setStatus("INVALID");
            otpLog.setAttemptCount((otpLog.getAttemptCount() == null ? 0 : otpLog.getAttemptCount()) + 1);
            if (otpLog.getAttemptCount() >= 5) {
                otpLog.setValid(false);
            }
            otpLogRepository.save(otpLog);
            throw new RuntimeException("OTP không hợp lệ");
        }

        if (otpLog.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpLog.setStatus("EXPIRED");
            otpLog.setValid(false);
            otpLogRepository.save(otpLog);
            throw new RuntimeException("OTP đã hết hạn (10 phút). Vui lòng đăng ký lại.");
        }

        user.setEmailVerified(true);
        userRepository.save(user);

        otpLog.setStatus("VERIFIED");
        otpLog.setUsed(true);
        otpLog.setValid(false);
        otpLog.setUsedAt(LocalDateTime.now());
        otpLogRepository.save(otpLog);

        log.info("Email verified via OTP for: {}", email);
    }

    private void createOtpLog(User user, String email, String otpCode) {
        // Invalidate previous active OTPs for this email
        List<EmailVerificationOtpLog> activeLogs = otpLogRepository.findAllByEmailAndValidTrueAndUsedFalse(email);
        for (EmailVerificationOtpLog log : activeLogs) {
            log.setStatus("SUPERSEDED");
            log.setValid(false);
        }
        if (!activeLogs.isEmpty()) {
            otpLogRepository.saveAll(activeLogs);
        }

        EmailVerificationOtpLog otpLog = new EmailVerificationOtpLog();
        otpLog.setUser(user);
        otpLog.setEmail(email);
        otpLog.setOtpCode(otpCode);
        otpLog.setStatus("PENDING");
        otpLog.setValid(true);
        otpLog.setUsed(false);
        otpLog.setSentAt(LocalDateTime.now());
        otpLog.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        otpLog.setAttemptCount(0);
        otpLogRepository.save(otpLog);
    }

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------
    private Optional<User> resolveUser(String identifier) {
        if (EMAIL_REGEX.matcher(identifier).matches()) {
            return userRepository.findByEmail(identifier);
        }
        String digitsOnly = identifier.replaceAll("[^0-9]", "");
        if (!digitsOnly.isEmpty() && digitsOnly.equals(identifier.replaceAll("\\D", ""))) {
            List<User> byPhone = userRepository.findAllByPhoneNumber(digitsOnly);
            if (byPhone.size() > 1) {
                throw new RuntimeException("Dữ liệu số điện thoại bị trùng. Vui lòng đăng nhập bằng email hoặc liên hệ quản trị viên.");
            }
            if (byPhone.size() == 1) {
                return Optional.of(byPhone.get(0));
            }
        }
        return userRepository.findByUsername(identifier);
    }

    private boolean verifyPassword(String rawPassword, User user) {
        if (user.getPassword() == null) {
            return false;
        }
        if (user.getPassword().startsWith("$2")) {
            String dbHash = user.getPassword();
            if (dbHash.startsWith("$2b$")) {
                dbHash = "$2a$" + dbHash.substring(4);
            }
            return BCrypt.checkpw(rawPassword, dbHash);
        }
        // BUG-028: Legacy plaintext không còn được chấp nhận
        // Nếu password không có prefix BCrypt → tài khoản cần được reset
        return false;
    }

    private String generateUsername(boolean isEmail, String identifier) {
        String base;
        if (isEmail) {
            base = "customer_" + identifier.split("@")[0].replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        } else {
            base = "customer_" + identifier;
        }
        // Đảm bảo username unique
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + "_" + suffix++;
        }
        return candidate;
    }

    private String generateOtp() {
        return String.format("%06d", (int)(Math.random() * 1000000));
    }
}
