package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_corrections")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AttendanceCorrection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "previous_status", nullable = false)
    private String previousStatus; // ABSENT, LATE

    @Column(name = "requested_status", nullable = false)
    private String requestedStatus; // PRESENT, EXCUSED

    @Column(nullable = false, length = 1000)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy; // Faculty who approved/rejected

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PENDING; // PENDING, APPROVED, REJECTED

    private String remarks;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = Status.PENDING;
    }

    public enum Status {
        PENDING, APPROVED, REJECTED
    }
}
