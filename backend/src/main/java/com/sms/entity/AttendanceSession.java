package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AttendanceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_code", unique = true, length = 10)
    private String sessionCode; // 6-character unique code e.g. "8K3B29"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private User faculty;

    @Column(nullable = false)
    private LocalDate date;

    private String section; // Section e.g. "A"

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.ACTIVE; // ACTIVE, CLOSED, LOCKED

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SessionType sessionType = SessionType.ONLINE_CODE; // MANUAL, ONLINE_CODE, ONLINE_QR

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = Status.ACTIVE;
    }

    public enum Status {
        ACTIVE, CLOSED, LOCKED
    }

    public enum SessionType {
        MANUAL, ONLINE_CODE, ONLINE_QR
    }
}
