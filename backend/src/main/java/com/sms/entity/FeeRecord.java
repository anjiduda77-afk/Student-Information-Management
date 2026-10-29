package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a fee payment record for a specific student.
 * One record per (student, feeStructure) pair.
 */
@Entity
@Table(name = "fee_records",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "fee_structure_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FeeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Auto-generated receipt number, e.g. AU-FEE-2024-00001 */
    @Column(name = "receipt_number", unique = true)
    private String receiptNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fee_structure_id", nullable = false)
    private FeeStructure feeStructure;

    /** Total amount due (fee + any late fine at time of payment) */
    @Column(name = "amount_due", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountDue;

    /** Actual amount paid */
    @Column(name = "amount_paid", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal amountPaid = BigDecimal.ZERO;

    /** Late fine applied */
    @Column(name = "late_fine", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal lateFine = BigDecimal.ZERO;

    /** Concession/waiver amount */
    @Column(precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal concession = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    /** Payment method: CASH, ONLINE, DD, CHEQUE */
    @Column(name = "payment_mode")
    private String paymentMode;

    /** Transaction/Challan reference number */
    @Column(name = "transaction_reference")
    private String transactionReference;

    /** Date when payment was completed */
    @Column(name = "payment_date")
    private LocalDate paymentDate;

    /** Admin who marked/collected payment */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collected_by")
    private User collectedBy;

    private String remarks;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = PaymentStatus.PENDING;
        if (amountPaid == null) amountPaid = BigDecimal.ZERO;
        if (lateFine == null) lateFine = BigDecimal.ZERO;
        if (concession == null) concession = BigDecimal.ZERO;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum PaymentStatus {
        PENDING,    // Not yet paid
        PARTIAL,    // Partially paid
        PAID,       // Fully paid
        WAIVED,     // Fee waived/exempted
        OVERDUE     // Past due date and unpaid
    }
}
