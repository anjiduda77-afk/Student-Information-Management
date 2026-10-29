package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a fee structure/category defined by the institution.
 * e.g., Tuition Fee – CSE – 2024-25, Hostel Fee – 2024-25, etc.
 */
@Entity
@Table(name = "fee_structures")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FeeStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-readable name, e.g. "B.Tech Tuition Fee – Sem 1" */
    @Column(nullable = false)
    private String name;

    /** Fee category: TUITION, EXAM, HOSTEL, TRANSPORT, LIBRARY, DEVELOPMENT, MISCELLANEOUS */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FeeCategory category;

    /** Academic year: "2024-25" */
    @Column(name = "academic_year", nullable = false)
    private String academicYear;

    /** Optional department filter (null = all departments) */
    private String department;

    /** Optional semester filter (null = all semesters) */
    private Integer semester;

    /** Amount due */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /** Due date for this fee */
    @Column(name = "due_date")
    private LocalDate dueDate;

    /** Late fine per day after dueDate (0 = no fine) */
    @Column(name = "late_fine_per_day", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal lateFinePerDay = BigDecimal.ZERO;

    /** Optional description */
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = Status.ACTIVE;
        if (lateFinePerDay == null) lateFinePerDay = BigDecimal.ZERO;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum FeeCategory {
        TUITION, EXAM, HOSTEL, TRANSPORT, LIBRARY, DEVELOPMENT, MISCELLANEOUS
    }

    public enum Status {
        ACTIVE, INACTIVE
    }
}
