package com.restaurant.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RegisterRequest {
    /**
     * Email hoặc số điện thoại.
     * Email: phải chứa @ và là địa chỉ email hợp lệ.
     * Số điện thoại: chuỗi số (10-11 chữ số).
     */
    @NotBlank(message = "Email hoặc số điện thoại không được để trống")
    private String identifier;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$",
        message = "Mật khẩu tối thiểu 8 ký tự, gồm chữ thường, chữ hoa và số"
    )
    private String password;

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;
}
