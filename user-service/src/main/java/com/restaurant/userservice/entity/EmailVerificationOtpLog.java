package com.restaurant.userservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_verification_otp_logs", indexes = {
        @Index(name = "idx_otp_logs_email", columnList = "email"),
        @Index(name = "idx_otp_logs_status", columnList = "status"),
        @Index(name = "idx_otp_logs_expires_at", columnList = "expires_at")
})
@Getter
@Setter
public class EmailVerificationOtpLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(name = "otp_code", nullable = false, length = 6)
    private String otpCode;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "is_valid", nullable = false)
    private boolean valid = true;

    @Column(name = "is_used", nullable = false)
    private boolean used = false;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 0;

    @Column(name = "last_attempt_at")
    private LocalDateTime lastAttemptAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (this.sentAt == null) {
            this.sentAt = now;
        }
        if (this.expiresAt == null) {
            this.expiresAt = now.plusMinutes(10);
        }
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
