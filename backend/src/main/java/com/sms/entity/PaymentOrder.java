package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_orders", indexes = {
        @Index(name = "idx_order_order_id", columnList = "order_id"),
        @Index(name = "idx_order_student", columnList = "student_id"),
        @Index(name = "idx_order_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true, length = 64)
    private String orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fee_structure_id", nullable = false)
    private FeeStructure feeStructure;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String currency = "INR";

    @Column(name = "receipt_number", length = 50)
    private String receiptNumber;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "CREATED"; // CREATED, ATTEMPTED, SUCCESS, FAILED, CANCELLED

    @Builder.Default
    @Column(name = "gateway_provider", length = 30)
    private String gatewayProvider = "RAZORPAY_SANDBOX";

    @Column(name = "gateway_order_id", length = 100)
    private String gatewayOrderId;

    @Column(name = "gateway_payment_id", length = 100)
    private String gatewayPaymentId;

    @Column(name = "gateway_signature", length = 255)
    private String gatewaySignature;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "CREATED";
        if (currency == null) currency = "INR";
        if (gatewayProvider == null) gatewayProvider = "RAZORPAY_SANDBOX";
    }
}
