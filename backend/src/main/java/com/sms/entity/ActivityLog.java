package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;
    private String userName;
    private String userRole;

    @Column(nullable = false)
    private String action; // CREATE, UPDATE, DELETE, LOGIN, ATTENDANCE, MARKS, CERTIFICATE

    @Column(nullable = false)
    private String module; // STUDENTS, FACULTY, COURSES, ATTENDANCE, MARKS, EVENTS, CERTIFICATES, TIMETABLE, AUTH

    @Column(length = 1000)
    private String description;

    private String ipAddress;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }
}
