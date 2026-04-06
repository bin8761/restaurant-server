package com.restaurant.userservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * BUG-007 (fix đầy đủ): Lưu token bị thu hồi vào DB để bền vững qua restart
 * và hoạt động đúng khi deploy multi-instance.
 */
@Entity
@Table(
    name = "revoked_tokens",
    indexes = @Index(name = "idx_revoked_token", columnList = "token", unique = true)
)
@Getter
@Setter
@NoArgsConstructor
public class RevokedToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * JWT gốc (có thể dài). MEDIUMTEXT để tránh tràn index.
     * Nếu muốn dùng index hiệu quả hơn có thể đổi sang SHA-256 hash.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String token;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public RevokedToken(String token, Instant expiresAt) {
        this.token = token;
        this.expiresAt = expiresAt;
    }
}
