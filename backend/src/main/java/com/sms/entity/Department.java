package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "departments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code; // e.g. CSE, AIML, ECE, EEE, MECH

    @Column(nullable = false)
    private String name;

    @Column(name = "head_of_department")
    private String headOfDepartment;

    private String description;

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
    }
}
