package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "course_id", "date"})
})
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

    @Column(nullable = false)
    private LocalDate date;

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
