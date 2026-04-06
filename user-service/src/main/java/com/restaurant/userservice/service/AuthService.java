package com.restaurant.userservice.service;

import com.restaurant.userservice.dto.AuthResponse;
import com.restaurant.userservice.dto.LoginRequest;
import com.restaurant.userservice.dto.RegisterRequest;
import com.restaurant.userservice.entity.Role;
import com.restaurant.userservice.entity.User;
import com.restaurant.userservice.repository.RoleRepository;
import com.restaurant.userservice.repository.UserRepository;
import com.restaurant.userservice.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String CUSTOMER_ROLE_NAME = "CUSTOMER";
    private static final Pattern EMAIL_REGEX =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final UserRepository userRepository;
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

        // Nếu là CUSTOMER, bắt buộc phải xác thực email
        if (CUSTOMER_ROLE_NAME.equals(user.getRole().getName()) && !user.isEmailVerified()) {
            throw new RuntimeException("Email chưa được xác thực. Vui lòng kiểm tra hộp thư và bấm link xác thực.");
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
        String identifier = request.getIdentifier().trim();
        boolean isEmail = EMAIL_REGEX.matcher(identifier).matches();

        if (isEmail) {
            if (userRepository.existsByEmail(identifier)) {
                throw new RuntimeException("Email này đã được đăng ký");
            }
        } else {
            // Chuẩn hoá: chỉ giữ chữ số
            identifier = identifier.replaceAll("[^0-9]", "");
            if (identifier.length() < 9 || identifier.length() > 11) {
                throw new RuntimeException("Số điện thoại không hợp lệ (9–11 chữ số)");
            }
            if (userRepository.existsByPhoneNumber(identifier)) {
                throw new RuntimeException("Số điện thoại này đã được đăng ký");
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

        if (isEmail) {
            user.setEmail(identifier);
        } else {
            user.setPhoneNumber(identifier);
            // Số điện thoại không có email → không thể xác thực qua email
            // Đặt emailVerified = true ngay (xác thực qua SĐT là đủ)
            user.setEmailVerified(true);
        }

        // Tạo verification token cho đăng ký bằng email
        String verificationToken = null;
        if (isEmail) {
            verificationToken = UUID.randomUUID().toString();
            user.setEmailVerificationToken(verificationToken);
            user.setEmailVerificationExpiresAt(LocalDateTime.now().plusHours(24));
        }

        userRepository.save(user);

        // Gửi email xác thực
        if (isEmail) {
            emailService.sendVerificationEmail(identifier, request.getFullName().trim(), verificationToken);
        }
    }

    // -------------------------------------------------------
    // Xác thực email qua token
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

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------
    private Optional<User> resolveUser(String identifier) {
        if (EMAIL_REGEX.matcher(identifier).matches()) {
            return userRepository.findByEmail(identifier);
        }
        String digitsOnly = identifier.replaceAll("[^0-9]", "");
        if (!digitsOnly.isEmpty() && digitsOnly.equals(identifier.replaceAll("\\D", ""))) {
            Optional<User> byPhone = userRepository.findByPhoneNumber(digitsOnly);
            if (byPhone.isPresent()) return byPhone;
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
}
