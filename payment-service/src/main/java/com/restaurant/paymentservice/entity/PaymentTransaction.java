package com.restaurant.paymentservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "payment_transactions",
        indexes = {
                @Index(name = "idx_tx_ref", columnList = "transaction_ref", unique = true),
                @Index(name = "idx_provider_ref", columnList = "provider_reference"),
                @Index(name = "idx_provider_status", columnList = "provider,status"),
                @Index(name = "idx_expire_at", columnList = "expire_at")
        }
)
@Getter
@Setter
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_request_id")
    private Integer paymentRequestId;

    @Column(name = "order_id", nullable = false)
    private Integer orderId;

    @Column(name = "table_id")
    private Integer tableId;

    @Column(name = "table_key", length = 255)
    private String tableKey;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "transaction_ref", nullable = false, length = 100, unique = true)
    private String transactionRef;

    @Column(name = "provider_reference", length = 255)
    private String providerReference;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "expire_at")
    private LocalDateTime expireAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "qr_content", columnDefinition = "TEXT")
    private String qrContent;

    @Column(name = "qr_image_url", columnDefinition = "TEXT")
    private String qrImageUrl;

    @Column(name = "pay_url", columnDefinition = "TEXT")
    private String payUrl;

    @Column(name = "refund_required_manual")
    private Boolean refundRequiredManual = false;

    @Column(name = "refunded_manual")
    private Boolean refundedManual = false;

    @Column(name = "refunded_by", length = 100)
    private String refundedBy;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "refund_note", columnDefinition = "TEXT")
    private String refundNote;

    @Column(name = "raw_create_payload", columnDefinition = "LONGTEXT")
    private String rawCreatePayload;

    @Column(name = "raw_webhook_payload", columnDefinition = "LONGTEXT")
    private String rawWebhookPayload;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (status == null) {
            status = "PENDING";
        }
        if (refundRequiredManual == null) {
            refundRequiredManual = false;
        }
        if (refundedManual == null) {
            refundedManual = false;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
