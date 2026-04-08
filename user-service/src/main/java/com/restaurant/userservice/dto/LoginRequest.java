package com.restaurant.userservice.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class LoginRequest {
    /**
     * Chấp nhận email, số điện thoại, hoặc username.
     * Ánh xạ từ "username" hoặc "identifier" của client.
     */
    @JsonAlias("identifier")
    @NotBlank(message = "Tên đăng nhập không được để trống")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;

    /**
     * Helper để lấy identifier (username/email/phone) cho AuthService.
     */
    public String getIdentifier() {
        return username;
    }
}
