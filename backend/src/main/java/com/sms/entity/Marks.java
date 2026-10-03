package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "marks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Marks {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamType examType;

    @Column(nullable = false)
    private Double marksObtained;

    @Column(nullable = false)
    private Double totalMarks;

    private String grade;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        uploadedAt = LocalDateTime.now();
        // Auto-calculate grade based on percentage
        double pct = (marksObtained / totalMarks) * 100;
        if (pct >= 90) grade = "O";        // Outstanding
        else if (pct >= 80) grade = "A+";
        else if (pct >= 70) grade = "A";
        else if (pct >= 60) grade = "B+";
        else if (pct >= 50) grade = "B";
        else if (pct >= 40) grade = "C";
        else grade = "F";
    }

    public enum ExamType {
        MIDTERM, FINAL, ASSIGNMENT, QUIZ, PRACTICAL, INTERNAL, EXTERNAL
    }
}
