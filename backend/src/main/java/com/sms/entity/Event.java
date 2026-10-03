package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_code", unique = true, length = 30)
    private String eventCode; // e.g. "EVT-2026-001"

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String category; // Technical, Cultural, Sports, Workshop, Seminar, Hackathon

    @Column(name = "poster_url", length = 1000)
    private String posterUrl;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(nullable = false)
    private String venue;

    private String organizer; // e.g. Department of CSE / IEEE Student Branch

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coordinator_id")
    private User coordinator; // Faculty or Admin creator

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Column(name = "registration_deadline")
    private LocalDateTime registrationDeadline;

    @Column(columnDefinition = "TEXT")
    private String rules;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.REGISTRATION_OPEN;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = Status.REGISTRATION_OPEN;
        if (eventCode == null) {
            eventCode = "EVT-" + LocalDate.now().getYear() + "-" + String.format("%04d", (int)(Math.random() * 9000 + 1000));
        }
    }

    public enum Status {
        DRAFT, PUBLISHED, REGISTRATION_OPEN, REGISTRATION_CLOSED, ONGOING, COMPLETED, CANCELLED
    }
}
