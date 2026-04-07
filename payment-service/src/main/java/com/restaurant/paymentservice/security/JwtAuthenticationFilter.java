package com.restaurant.paymentservice.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String ADMIN_ROLE = "ADMIN";
    private static final String STAFF_ROLE = "STAFF";

    private final JwtUtil jwtUtil;
    private final String internalServiceToken;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, @Value("${internal.service-token:}") String internalServiceToken) {
        this.jwtUtil = jwtUtil;
        this.internalServiceToken = internalServiceToken;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        if (isTrustedInternalCall(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();

        if (path.startsWith("/ws/")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (path.contains("/request")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (path.contains("/sepay/webhook")
                || path.contains("/sepay/create")
                || (path.contains("/sepay/") && path.endsWith("/status"))) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String token = authHeader.substring(7);

        try {
            Claims claims = jwtUtil.extractAllClaims(token);
            request.setAttribute("userId", claims.get("id"));
            request.setAttribute("username", claims.get("username"));
            request.setAttribute("roleId", claims.get("role_id"));
            String roleName = claims.get("role_name", String.class);
            request.setAttribute("roleName", roleName);

            boolean allowed = ADMIN_ROLE.equalsIgnoreCase(roleName)
                    || STAFF_ROLE.equalsIgnoreCase(roleName)
                    || "MANAGER".equalsIgnoreCase(roleName)
                    || "CASHIER".equalsIgnoreCase(roleName);
            if (!allowed) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                return;
            }

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isTrustedInternalCall(HttpServletRequest request) {
        String header = request.getHeader("X-Service-Token");
        return internalServiceToken != null
                && !internalServiceToken.isBlank()
                && internalServiceToken.equals(header);
    }
}
