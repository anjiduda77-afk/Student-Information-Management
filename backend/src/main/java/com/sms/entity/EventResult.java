package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_results", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"event_id", "student_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Position position; // WINNER, RUNNER_UP, SECOND_RUNNER_UP, SPECIAL_RECOGNITION, PARTICIPANT

    private Double score;
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt;

    @PrePersist
    protected void onCreate() {
        if (recordedAt == null) recordedAt = LocalDateTime.now();
    }

    public enum Position {
        WINNER, RUNNER_UP, SECOND_RUNNER_UP, SPECIAL_RECOGNITION, PARTICIPANT
    }
}
