package com.restaurant.userservice.config;

import com.restaurant.userservice.security.JwtAuthenticationFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitInterceptor rateLimitInterceptor;

    public WebConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                     RateLimitInterceptor rateLimitInterceptor) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.rateLimitInterceptor = rateLimitInterceptor;
    }

    // BUG-029: Giới hạn CORS chỉ cho các origin đã biết
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(
                        "http://localhost:3010",
                        "http://localhost:3011",
                        "http://localhost:3000",
                        "${APP_ALLOWED_ORIGINS:http://localhost:3010,http://localhost:3011}"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

        // BUG-023: Rate limiting cho các endpoint đăng nhập / đăng ký / verify-email / verify-otp
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns(
                        "/api/users/login",
                        "/api/users/register",
                "/api/users/verify-email",
                "/api/users/verify-otp"
                );
    }

    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilter() {
        FilterRegistrationBean<JwtAuthenticationFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(jwtAuthenticationFilter);
        registrationBean.addUrlPatterns("/api/users/*", "/api/users/me", "/api/users/logout");
        return registrationBean;
    }
}
