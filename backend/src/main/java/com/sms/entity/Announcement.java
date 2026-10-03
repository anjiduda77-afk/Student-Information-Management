package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false)
    private String category; // ACADEMIC, EXAM, EVENT, GENERAL, URGENT

    @Builder.Default
    private String priority = "NORMAL"; // NORMAL, HIGH, URGENT

    @Builder.Default
    private String targetRole = "ALL"; // ALL, STUDENT, FACULTY, ADMIN

    private String targetDepartment; // ALL or specific like CSE

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Builder.Default
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (active == null) active = true;
        if (priority == null) priority = "NORMAL";
        if (targetRole == null) targetRole = "ALL";
    }
}
