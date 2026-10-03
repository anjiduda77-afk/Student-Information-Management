package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "courses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;
    private Integer credits;
    private Integer semester;

    @Builder.Default
    private String duration = "4 Years (8 Semesters)";

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id")
    private User faculty;

    @Builder.Default
    @ManyToMany(mappedBy = "courses", fetch = FetchType.LAZY)
    private Set<User> students = new HashSet<>();
}
