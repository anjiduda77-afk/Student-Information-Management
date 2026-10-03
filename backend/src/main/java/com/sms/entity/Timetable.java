package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;

@Entity
@Table(name = "timetable")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Timetable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "academic_year")
    private String academicYear; // e.g. "2025-2026"

    @Column(nullable = false)
    private Integer semester;

    @Column(nullable = false)
    private String section; // A, B, C

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    private String subjectName; // convenience or fallback

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private User faculty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek dayOfWeek; // MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private String classroom; // e.g. "LH-101", "Lab-2"

    @Builder.Default
    private String status = "PUBLISHED"; // DRAFT, PUBLISHED

    public enum DayOfWeek {
        MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY
    }
}
