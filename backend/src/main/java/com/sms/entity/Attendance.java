package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private AttendanceSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id")
    private User faculty;

    @Column(nullable = false)
    private LocalDate date;

    private Integer period; // 1, 2, 3, 4, etc.

    private String section; // A, B, etc.

    @Column(name = "academic_year")
    private String academicYear;

    private Integer semester;

    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Builder.Default
    @Column(name = "verification_method")
    private String verificationMethod = "MANUAL"; // MANUAL, ONLINE_CODE, QR_SCAN

    @Column(name = "marked_at")
    private LocalDateTime markedAt;

    @Builder.Default
    @Column(name = "is_locked")
    private Boolean isLocked = false;

    @PrePersist
    protected void onCreate() {
        if (markedAt == null) markedAt = LocalDateTime.now();
        if (isLocked == null) isLocked = false;
        if (verificationMethod == null) verificationMethod = "MANUAL";
    }

    public enum Status {
        PRESENT, ABSENT, LATE, EXCUSED
    }
}
