package com.restaurant.orderservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "table_id", nullable = false)
    private Integer tableId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "order_time", nullable = false)
    private LocalDateTime orderTime;

    @Column(length = 50)
    private String status;

    @Column(precision = 18, scale = 2)
    private BigDecimal total;

    @Column(name = "table_key", length = 100)
    private String tableKey;

    @Column(name = "is_buffet")
    private Boolean isBuffet;

    @Column(name = "buffet_session_id", length = 255)
    private String buffetSessionId;

    @Column(name = "buffet_package_id")
    private Integer buffetPackageId;

    @Column(name = "buffet_package_name", length = 255)
    private String buffetPackageName;

    @Column(name = "num_adults")
    private Integer numAdults;

    @Column(name = "num_children")
    private Integer numChildren;

    @Column(name = "buffet_expiry_time")
    private LocalDateTime buffetExpiryTime;

    @Column(name = "payment_status", length = 50)
    private String paymentStatus;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderDetail> details = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.orderTime = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = "Chờ xác nhận";
        if (this.paymentStatus == null) this.paymentStatus = "unpaid";
        if (this.isBuffet == null) this.isBuffet = false;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
