package com.restaurant.menuservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "buffet_packages")
@Getter
@Setter
public class BuffetPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(precision = 18, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(name = "price_child", precision = 18, scale = 2)
    private BigDecimal priceChild;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "buffet_package_foods",
        joinColumns = @JoinColumn(name = "buffet_package_id"),
        inverseJoinColumns = @JoinColumn(name = "food_id")
    )
    private List<Food> foods = new ArrayList<>();
}
