package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "academic_sections")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AcademicSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code; // e.g. CSE-4A, ECE-2B, AIML-6A

    @Column(name = "section_name", nullable = false)
    private String sectionName; // e.g. A, B, C, D

    @Column(nullable = false)
    private Integer semester; // 1 to 8

    @Column(name = "academic_year", nullable = false)
    @Builder.Default
    private String academicYear = "2025-26";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_advisor_id")
    private User advisor;

    @Column(name = "room_number")
    @Builder.Default
    private String roomNumber = "Lecture Hall 101";

    @Builder.Default
    private Integer capacity = 60;

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
        if (academicYear == null) academicYear = "2025-26";
        if (capacity == null) capacity = 60;
    }
}
