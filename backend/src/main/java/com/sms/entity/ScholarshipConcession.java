package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "scholarships_concessions", indexes = {
        @Index(name = "idx_sc_student", columnList = "student_id"),
        @Index(name = "idx_sc_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ScholarshipConcession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fee_structure_id", nullable = false)
    private FeeStructure feeStructure;

    @Column(nullable = false, length = 50)
    private String concessionType; // MERIT, SPORTS, NEED_BASED, SIBLING, STAFF_WARD, SPECIAL

    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private BigDecimal discountPercentage;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 500)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "APPROVED"; // APPROVED, PENDING, REJECTED

    @Column(name = "supporting_document_url", length = 500)
    private String supportingDocumentUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "APPROVED";
    }
}
