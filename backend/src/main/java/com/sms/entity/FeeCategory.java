package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "fee_categories", indexes = {
        @Index(name = "idx_fee_cat_code", columnList = "code")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FeeCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // TUITION, TRANSPORT, HOSTEL, EXAM, LIBRARY, LAB, ADMISSION, REGISTRATION, CAUTION_DEPOSIT, ACTIVITY, MISC

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
