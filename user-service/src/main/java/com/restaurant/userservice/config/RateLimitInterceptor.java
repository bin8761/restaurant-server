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

    // IP → hàng đợi timestamp của các request
    private final ConcurrentHashMap<String, Deque<Long>> requestLog = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                             @NonNull HttpServletResponse response,
                             @NonNull Object handler) throws IOException {
        String ip = resolveClientIp(request);
        long now = System.currentTimeMillis();

        Deque<Long> timestamps = requestLog.computeIfAbsent(ip, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            // Xóa các timestamp ngoài cửa sổ thời gian
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MS) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= MAX_REQUESTS) {
                response.setStatus(429);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"message\": \"Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút\"}");
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
        return request.getRemoteAddr();
    }
}
