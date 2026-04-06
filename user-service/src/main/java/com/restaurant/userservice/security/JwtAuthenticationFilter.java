package com.restaurant.userservice.security;

import com.restaurant.userservice.service.TokenBlacklistService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.lang.NonNull;

import java.io.IOException;
import org.springframework.stereotype.Component;


@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, TokenBlacklistService tokenBlacklistService) {
        this.jwtUtil = jwtUtil;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        // Public endpoints — không cần token
        if (path.equals("/api/users/login")
                || path.equals("/api/users/register")
                || path.startsWith("/api/users/verify-email")
                || path.equals("/api/users/logout")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {  
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\": \"Missing or invalid token\"}");
            return;
        }

        String token = authHeader.substring(7);

        // BUG-007: Kiểm tra token có bị thu hồi chưa
        if (tokenBlacklistService.isBlacklisted(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\": \"Token đã bị thu hồi, vui lòng đăng nhập lại\"}");
            return;
        }

        try {
            Claims claims = jwtUtil.extractAllClaims(token);
            request.setAttribute("userId", claims.get("id"));
            request.setAttribute("username", claims.get("username"));
            request.setAttribute("roleId", claims.get("role_id"));

            // Role authorization checks — POST /api/users chỉ cho ADMIN (role 1)
            // Ngoại lệ: /logout đã được bỏ qua ở trên (public endpoint)
            if (path.startsWith("/api/users") && request.getMethod().equals("POST")
                    && !path.equals("/api/users/logout")) {
                 if (((Integer) claims.get("role_id")) != 1) {
                     response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                     return;
                 }
            }

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\": \"Invalid token\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
