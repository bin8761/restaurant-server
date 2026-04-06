package com.restaurant.userservice.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * BUG-023: Rate limiter đơn giản theo IP cho các auth endpoints.
 * Giới hạn: 10 request / 60 giây / IP.
 * Không dùng Redis nên chỉ phù hợp single-instance. Nâng cấp lên bucket4j + Redis cho multi-instance.
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final int MAX_REQUESTS = 10;
    private static final long WINDOW_MS = 60_000L; // 1 phút
    private static final int OTP_MAX_REQUESTS = 5;
    private static final long OTP_WINDOW_MS = 10 * 60_000L; // 10 phút

    // IP → hàng đợi timestamp của các request
    private final ConcurrentHashMap<String, Deque<Long>> requestLog = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                             @NonNull HttpServletResponse response,
                             @NonNull Object handler) throws IOException {
        String ip = resolveClientIp(request);
        String path = request.getRequestURI();
        long now = System.currentTimeMillis();

        boolean isVerifyOtp = "/api/users/verify-otp".equals(path);
        int maxRequests = isVerifyOtp ? OTP_MAX_REQUESTS : MAX_REQUESTS;
        long windowMs = isVerifyOtp ? OTP_WINDOW_MS : WINDOW_MS;

        String key = ip;
        if (isVerifyOtp) {
            String email = request.getParameter("email");
            if (email != null && !email.isBlank()) {
                // Limit theo email để giảm brute-force OTP từ nhiều IP
                key = "otp-email:" + email.trim().toLowerCase();
            }
        }

        Deque<Long> timestamps = requestLog.computeIfAbsent(key, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            // Xóa các timestamp ngoài cửa sổ thời gian
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > windowMs) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxRequests) {
                response.setStatus(429);
                response.setContentType("application/json;charset=UTF-8");
                if (isVerifyOtp) {
                    response.getWriter().write("{\"message\": \"Bạn đã nhập sai OTP quá nhiều lần. Vui lòng thử lại sau 10 phút\"}");
                } else {
                    response.getWriter().write("{\"message\": \"Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút\"}");
                }
                return false;
            }
            timestamps.addLast(now);
        }
        return true;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // Chỉ lấy IP đầu tiên (client thực sự) để tránh header giả mạo
            return forwarded.split(",")[0].trim();
        }

        // RFC 7239: Forwarded: for=203.0.113.60;proto=http;by=203.0.113.43
        String standardForwarded = request.getHeader("Forwarded");
        if (standardForwarded != null && !standardForwarded.isBlank()) {
            for (String part : standardForwarded.split(";")) {
                String trimmed = part.trim();
                if (trimmed.toLowerCase().startsWith("for=")) {
                    String value = trimmed.substring(4).trim();
                    value = value.replace("\"", "");
                    if (!value.isBlank()) {
                        return value;
                    }
                }
            }
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }
}
