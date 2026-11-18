package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "offline_payment_submissions", indexes = {
        @Index(name = "idx_offline_student", columnList = "student_id"),
        @Index(name = "idx_offline_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OfflinePaymentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fee_structure_id", nullable = false)
    private FeeStructure feeStructure;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_mode", nullable = false, length = 50)
    private String paymentMode; // NEFT, RTGS, BANK_CHALLAN, DEMAND_DRAFT, UPI_DIRECT

    @Column(name = "transaction_reference", nullable = false, length = 100)
    private String transactionReference;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "proof_document_url", length = 500)
    private String proofDocumentUrl;

    @Column(length = 500)
    private String remarks;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "PENDING"; // PENDING, VERIFIED, REJECTED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
    }
}
