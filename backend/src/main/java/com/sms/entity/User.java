package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "username")
    private String username;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Contact & Common Profile
    @Column(name = "mobile_number")
    private String mobileNumber;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    private String gender; // Male, Female, Other
    private String address;

    @Column(name = "profile_photo")
    private String profilePhoto;

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    // Student-specific fields
    @Column(name = "student_id", unique = true)
    private String studentId; // e.g. STU-2023-001

    @Column(name = "roll_number", unique = true)
    private String rollNumber; // e.g. CSE2023001

    private String branch;
    private Integer semester;
    private String section; // A, B, C

    @Column(name = "admission_year")
    private Integer admissionYear;

    @Column(name = "academic_year")
    private String academicYear; // e.g. 2023-2027

    // Faculty-specific fields
    @Column(name = "faculty_id", unique = true)
    private String facultyId; // e.g. FAC-CSE-001

    private String department;
    private String designation; // Professor, Associate Professor, Assistant Professor, HOD

    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_courses",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "course_id"))
    private Set<Course> courses = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
        if (username == null) username = email;
    }

    public enum Role {
        ADMIN, FACULTY, STUDENT
    }
}
