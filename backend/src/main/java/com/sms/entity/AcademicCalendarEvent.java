package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "academic_calendar_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AcademicCalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private EventType eventType; // EXAMINATION, HOLIDAY, ACADEMIC_MILESTONE, DEADLINE, CAMPUS_EVENT, GENERAL

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    private String venue;

    @Column(name = "target_audience")
    @Builder.Default
    private String targetAudience = "ALL"; // ALL, STUDENTS, FACULTY, CSE, etc.

    private Integer semester;

    @Column(name = "is_holiday")
    @Builder.Default
    private Boolean isHoliday = false;

    @Column(name = "linked_event_id")
    private Long linkedEventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (endDate == null) endDate = startDate;
        if (isHoliday == null) isHoliday = (eventType == EventType.HOLIDAY);
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (endDate == null) endDate = startDate;
    }

    public enum EventType {
        EXAMINATION,
        HOLIDAY,
        ACADEMIC_MILESTONE,
        DEADLINE,
        CAMPUS_EVENT,
        GENERAL
    }
}

