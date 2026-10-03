package com.sms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificate_templates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificateTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TemplateType templateType; // WINNER, RUNNER_UP, PARTICIPATION, ACHIEVEMENT, SPECIAL_RECOGNITION, CUSTOM

    @Builder.Default
    private String title = "CERTIFICATE OF EXCELLENCE";

    @Builder.Default
    private String subtitle = "THIS IS PROUDLY PRESENTED TO";

    @Builder.Default
    private String collegeName = "ADITYA UNIVERSITY";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private String borderStyle = "CLASSIC_GOLD"; // CLASSIC_GOLD, ROYAL_NAVY, MODERN_MINIMAL, ELEGANT_MAROON, VINTAGE_CREAM

    @Builder.Default
    private Integer borderWidth = 4;

    @Builder.Default
    private String borderColor = "#d99b26";

    @Builder.Default
    private String fontFamily = "Playfair Display"; // Playfair Display, Cinzel, Montserrat, Inter, Serif

    @Builder.Default
    private Integer fontSize = 16;

    @Builder.Default
    private String fontWeight = "normal";

    @Builder.Default
    private String textAlignment = "CENTER"; // CENTER, LEFT, RIGHT

    @Builder.Default
    private String textColor = "#1e293b";

    @Builder.Default
    private String primaryColor = "#1e3a8a"; // Navy / Blue

    @Builder.Default
    private String secondaryColor = "#d99b26"; // Aditya Gold / Amber

    @Builder.Default
    private String backgroundColor = "#ffffff";

    @Builder.Default
    private String signatoryTitle = "Head of Department & Convener";

    @Builder.Default
    private String signatoryName = "Dr. Priya Sharma";

    private String signatory2Title;
    private String signatory2Name;

    private String logoUrl;
    private String signatureUrl;

    @Column(columnDefinition = "TEXT")
    private String bodyTemplate; // Template with dynamic placeholders

    @Builder.Default
    private String status = "PUBLISHED"; // DRAFT, PUBLISHED

    @Builder.Default
    private Integer version = 1;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (status == null) status = "PUBLISHED";
        if (version == null) version = 1;
        if (collegeName == null) collegeName = "ADITYA UNIVERSITY";
        if (bodyTemplate == null) {
            bodyTemplate = "in recognition of outstanding performance and securing {{POSITION}} in {{EVENT_NAME}} organized by the Department of {{DEPARTMENT}}, held on {{EVENT_DATE}} at {{VENUE}}.";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum TemplateType {
        WINNER, RUNNER_UP, PARTICIPATION, ACHIEVEMENT, SPECIAL_RECOGNITION, CUSTOM
    }
}
