package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_registrations", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"event_id", "student_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RegistrationStatus status = RegistrationStatus.CONFIRMED; // CONFIRMED, WAITLISTED, CANCELLED

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AttendanceStatus attendanceStatus = AttendanceStatus.PENDING; // PENDING, PRESENT, ABSENT

    @PrePersist
    protected void onCreate() {
        if (registeredAt == null) registeredAt = LocalDateTime.now();
        if (status == null) status = RegistrationStatus.CONFIRMED;
        if (attendanceStatus == null) attendanceStatus = AttendanceStatus.PENDING;
    }

    public enum RegistrationStatus {
        CONFIRMED, WAITLISTED, CANCELLED
    }

    public enum AttendanceStatus {
        PENDING, PRESENT, ABSENT
    }
}
