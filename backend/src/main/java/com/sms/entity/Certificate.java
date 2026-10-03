package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "certificate_id", unique = true, nullable = false, length = 50)
    private String certificateId; // e.g. SIS-EVT-2026-00001

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "certificate_type", nullable = false)
    private String certificateType; // WINNER, RUNNER_UP, PARTICIPATION, ACHIEVEMENT, SPECIAL_RECOGNITION

    private String position; // Winner, First Runner-up, Participant, etc.

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by")
    private User generatedBy; // Faculty/Admin

    @Column(name = "student_name", nullable = false)
    private String studentName;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Column(name = "college_name")
    @Builder.Default
    private String collegeName = "APEX INSTITUTE OF TECHNOLOGY & SCIENCE";

    @Column(name = "department_name")
    private String departmentName;

    @Column(name = "verification_url")
    private String verificationUrl;

    @Builder.Default
    private String status = "VALID"; // VALID, REVOKED

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @PrePersist
    protected void onCreate() {
        if (generatedAt == null) generatedAt = LocalDateTime.now();
        if (issueDate == null) issueDate = LocalDate.now();
        if (status == null) status = "VALID";
        if (collegeName == null) collegeName = "APEX INSTITUTE OF TECHNOLOGY & SCIENCE";
    }
}
