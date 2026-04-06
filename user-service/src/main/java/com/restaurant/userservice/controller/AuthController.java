package com.restaurant.userservice.controller;

import com.restaurant.userservice.dto.AuthResponse;
import com.restaurant.userservice.dto.LoginRequest;
import com.restaurant.userservice.dto.RegisterRequest;
import com.restaurant.userservice.dto.UserDto;
import com.restaurant.userservice.security.JwtUtil;
import com.restaurant.userservice.service.AuthService;
import com.restaurant.userservice.service.TokenBlacklistService;
import com.restaurant.userservice.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;

    @Value("${app.frontend-url:http://localhost:3001}")
    private String frontendUrl;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(Map.of(
                "message", "Nếu thông tin hợp lệ, hệ thống đã gửi OTP tới email để bạn xác thực tài khoản."
        ));
    }

    /**
     * Xác thực email. Được gọi khi customer bấm link trong email.
     * Sau khi xác thực thành công, redirect về trang login của Fe-Customer.
     */
    @GetMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(Map.of(
                "message", "Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.",
                "redirect", frontendUrl + "/login?verified=true"
        ));
    }

    /**
     * POST /api/users/verify-otp?email=xxx&otp=xxxxxx
     * Xác thực email bằng OTP 6 chữ số.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        authService.verifyEmailOtp(email, otp);
        return ResponseEntity.ok(Map.of(
                "message", "Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ."
        ));
    }

    /** BUG-007: Thu hồi token khi logout bằng cách thêm vào blacklist. */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                long expiry = jwtUtil.extractExpiration(token);
                tokenBlacklistService.blacklist(token, expiry);
            } catch (Exception ignored) {
                // Token đã hết hạn / invalid — không cần blacklist
            }
        }
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(HttpServletRequest request) {
        Integer userId = (Integer) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(userService.getUserById(userId));
    }
}
