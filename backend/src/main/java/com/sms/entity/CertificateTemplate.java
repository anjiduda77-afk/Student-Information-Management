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
    private String collegeName = "APEX INSTITUTE OF TECHNOLOGY & SCIENCE";

    @Builder.Default
    private String borderStyle = "CLASSIC_GOLD"; // CLASSIC_GOLD, ROYAL_BLUE, MODERN_MINIMAL, ELEGANT_MAROON

    @Builder.Default
    private String fontFamily = "Serif";

    @Builder.Default
    private String primaryColor = "#1e3a8a"; // Navy / Gold

    @Builder.Default
    private String signatoryTitle = "Head of Department & Convener";

    @Builder.Default
    private String signatoryName = "Dr. Priya Sharma";

    private String logoUrl;
    private String signatureUrl;

    @Column(columnDefinition = "TEXT")
    private String bodyTemplate; // Template with dynamic placeholders

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (bodyTemplate == null) {
            bodyTemplate = "in recognition of outstanding performance and securing {{POSITION}} in {{EVENT_NAME}} organized by the {{DEPARTMENT}}, held on {{EVENT_DATE}} at {{VENUE}}.";
        }
    }

    public enum TemplateType {
        WINNER, RUNNER_UP, PARTICIPATION, ACHIEVEMENT, SPECIAL_RECOGNITION, CUSTOM
    }
}
