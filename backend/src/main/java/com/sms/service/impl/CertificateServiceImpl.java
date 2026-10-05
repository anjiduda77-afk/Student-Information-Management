package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.*;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import com.sms.service.ActivityLogService;
import com.sms.service.CertificateService;
import com.sms.service.PdfCertificateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateServiceImpl implements CertificateService {

    private final CertificateRepository certificateRepository;
    private final CertificateTemplateRepository templateRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final PdfCertificateService pdfCertificateService;
    private final ActivityLogService activityLogService;

    private static final String DEFAULT_COLLEGE = "ADITYA UNIVERSITY";

    private synchronized String generateCertificateId(int year) {
        long count = certificateRepository.count() + 1;
        String id;
        do {
            id = String.format("SIS-EVT-%d-%05d", year, count);
            count++;
        } while (certificateRepository.existsByCertificateId(id));
        return id;
    }

    private AppDTO.CertificateDTO toDTO(Certificate c) {
        return AppDTO.CertificateDTO.builder()
                .id(c.getId())
                .certificateId(c.getCertificateId())
                .studentId(c.getStudent().getId())
                .studentName(c.getStudentName())
                .rollNumber(c.getStudent().getRollNumber())
                .eventId(c.getEvent().getId())
                .eventName(c.getEventName())
                .templateId(c.getTemplate() != null ? c.getTemplate().getId() : null)
                .templateName(c.getTemplate() != null ? c.getTemplate().getName() : "Standard Certificate")
                .templateVersion(c.getTemplateVersion() != null ? c.getTemplateVersion() : (c.getTemplate() != null ? c.getTemplate().getVersion() : 1))
                .certificateType(c.getCertificateType())
                .position(c.getPosition())
                .issueDate(c.getIssueDate())
                .collegeName(c.getCollegeName())
                .departmentName(c.getDepartmentName())
                .verificationUrl(c.getVerificationUrl())
                .status(c.getStatus())
                .signatoryName(c.getTemplate() != null ? c.getTemplate().getSignatoryName() : "Dr. Priya Sharma")
                .signatoryTitle(c.getTemplate() != null ? c.getTemplate().getSignatoryTitle() : "Dean of Academic Affairs & Faculty Convener")
                .revocationReason(c.getRevocationReason())
                .revokedAt(c.getRevokedAt())
                .revokedByName(c.getRevokedBy() != null ? c.getRevokedBy().getName() : null)
                .replacedByCertificateId(c.getReplacedByCertificateId())
                .generatedAt(c.getGeneratedAt())
                .build();
    }

    private AppDTO.CertificateTemplateDTO toTemplateDTO(CertificateTemplate t) {
        return AppDTO.CertificateTemplateDTO.builder()
                .id(t.getId())
                .name(t.getName())
                .templateType(t.getTemplateType().name())
                .title(t.getTitle())
                .subtitle(t.getSubtitle())
                .collegeName(t.getCollegeName())
                .description(t.getDescription())
                .borderStyle(t.getBorderStyle())
                .borderWidth(t.getBorderWidth())
                .borderColor(t.getBorderColor())
                .fontFamily(t.getFontFamily())
                .fontSize(t.getFontSize())
                .fontWeight(t.getFontWeight())
                .textAlignment(t.getTextAlignment())
                .textColor(t.getTextColor())
                .primaryColor(t.getPrimaryColor())
                .secondaryColor(t.getSecondaryColor())
                .backgroundColor(t.getBackgroundColor())
                .signatoryTitle(t.getSignatoryTitle())
                .signatoryName(t.getSignatoryName())
                .signatory2Title(t.getSignatory2Title())
                .signatory2Name(t.getSignatory2Name())
                .logoUrl(t.getLogoUrl())
                .signatureUrl(t.getSignatureUrl())
                .bodyTemplate(t.getBodyTemplate())
                .status(t.getStatus())
                .version(t.getVersion())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    // ================= Template Management =================

    @Override
    public List<CertificateTemplate> getAllTemplates() {
        return templateRepository.findAll();
    }

    @Override
    public List<AppDTO.CertificateTemplateDTO> getAllTemplateDTOs() {
        return templateRepository.findAll().stream()
                .map(this::toTemplateDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CertificateTemplate getTemplateById(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate template not found with ID: " + id));
    }

    @Override
    public AppDTO.CertificateTemplateDTO getTemplateDTOById(Long id) {
        return toTemplateDTO(getTemplateById(id));
    }

    @Override
    @Transactional
    public CertificateTemplate saveTemplate(CertificateTemplate template) {
        return templateRepository.save(template);
    }

    @Override
    @Transactional
    public AppDTO.CertificateTemplateDTO createTemplate(AppDTO.CertificateTemplateDTO dto, Long adminId) {
        CertificateTemplate.TemplateType type = CertificateTemplate.TemplateType.CUSTOM;
        if (dto.getTemplateType() != null) {
            try {
                type = CertificateTemplate.TemplateType.valueOf(dto.getTemplateType().toUpperCase());
            } catch (Exception ignored) {}
        }

        CertificateTemplate t = CertificateTemplate.builder()
                .name(dto.getName())
                .templateType(type)
                .title(dto.getTitle() != null ? dto.getTitle() : "CERTIFICATE OF EXCELLENCE")
                .subtitle(dto.getSubtitle() != null ? dto.getSubtitle() : "THIS IS PROUDLY PRESENTED TO")
                .collegeName(dto.getCollegeName() != null ? dto.getCollegeName() : DEFAULT_COLLEGE)
                .description(dto.getDescription())
                .borderStyle(dto.getBorderStyle() != null ? dto.getBorderStyle() : "CLASSIC_GOLD")
                .borderWidth(dto.getBorderWidth() != null ? dto.getBorderWidth() : 4)
                .borderColor(dto.getBorderColor() != null ? dto.getBorderColor() : "#d99b26")
                .fontFamily(dto.getFontFamily() != null ? dto.getFontFamily() : "Playfair Display")
                .fontSize(dto.getFontSize() != null ? dto.getFontSize() : 16)
                .fontWeight(dto.getFontWeight() != null ? dto.getFontWeight() : "normal")
                .textAlignment(dto.getTextAlignment() != null ? dto.getTextAlignment() : "CENTER")
                .textColor(dto.getTextColor() != null ? dto.getTextColor() : "#1e293b")
                .primaryColor(dto.getPrimaryColor() != null ? dto.getPrimaryColor() : "#1e3a8a")
                .secondaryColor(dto.getSecondaryColor() != null ? dto.getSecondaryColor() : "#d99b26")
                .backgroundColor(dto.getBackgroundColor() != null ? dto.getBackgroundColor() : "#ffffff")
                .signatoryTitle(dto.getSignatoryTitle() != null ? dto.getSignatoryTitle() : "Head of Department & Convener")
                .signatoryName(dto.getSignatoryName() != null ? dto.getSignatoryName() : "Dr. Priya Sharma")
                .signatory2Title(dto.getSignatory2Title() != null ? dto.getSignatory2Title() : "Dean of Academic Affairs")
                .signatory2Name(dto.getSignatory2Name() != null ? dto.getSignatory2Name() : "Dr. N. Satish Reddy")
                .logoUrl(dto.getLogoUrl())
                .signatureUrl(dto.getSignatureUrl())
                .bodyTemplate(dto.getBodyTemplate())
                .status(dto.getStatus() != null ? dto.getStatus() : "PUBLISHED")
                .version(1)
                .build();

        CertificateTemplate saved = templateRepository.save(t);

        if (adminId != null) {
            userRepository.findById(adminId).ifPresent(admin ->
                    activityLogService.log(admin.getEmail(), admin.getName(), admin.getRole().name(),
                            "CREATE", "CERTIFICATES", "TEMPLATE", String.valueOf(saved.getId()),
                            null, saved.getName(), "ADMIN created certificate template: " + saved.getName())
            );
        }

        return toTemplateDTO(saved);
    }

    @Override
    @Transactional
    public AppDTO.CertificateTemplateDTO updateTemplate(Long id, AppDTO.CertificateTemplateDTO dto, Long adminId) {
        CertificateTemplate t = getTemplateById(id);

        if (dto.getName() != null) t.setName(dto.getName());
        if (dto.getTitle() != null) t.setTitle(dto.getTitle());
        if (dto.getSubtitle() != null) t.setSubtitle(dto.getSubtitle());
        if (dto.getDescription() != null) t.setDescription(dto.getDescription());
        if (dto.getCollegeName() != null) t.setCollegeName(dto.getCollegeName());
        if (dto.getBorderStyle() != null) t.setBorderStyle(dto.getBorderStyle());
        if (dto.getBorderWidth() != null) t.setBorderWidth(dto.getBorderWidth());
        if (dto.getBorderColor() != null) t.setBorderColor(dto.getBorderColor());
        if (dto.getFontFamily() != null) t.setFontFamily(dto.getFontFamily());
        if (dto.getFontSize() != null) t.setFontSize(dto.getFontSize());
        if (dto.getFontWeight() != null) t.setFontWeight(dto.getFontWeight());
        if (dto.getTextAlignment() != null) t.setTextAlignment(dto.getTextAlignment());
        if (dto.getTextColor() != null) t.setTextColor(dto.getTextColor());
        if (dto.getPrimaryColor() != null) t.setPrimaryColor(dto.getPrimaryColor());
        if (dto.getSecondaryColor() != null) t.setSecondaryColor(dto.getSecondaryColor());
        if (dto.getBackgroundColor() != null) t.setBackgroundColor(dto.getBackgroundColor());
        if (dto.getSignatoryTitle() != null) t.setSignatoryTitle(dto.getSignatoryTitle());
        if (dto.getSignatoryName() != null) t.setSignatoryName(dto.getSignatoryName());
        if (dto.getSignatory2Title() != null) t.setSignatory2Title(dto.getSignatory2Title());
        if (dto.getSignatory2Name() != null) t.setSignatory2Name(dto.getSignatory2Name());
        if (dto.getLogoUrl() != null) t.setLogoUrl(dto.getLogoUrl());
        if (dto.getSignatureUrl() != null) t.setSignatureUrl(dto.getSignatureUrl());
        if (dto.getBodyTemplate() != null) t.setBodyTemplate(dto.getBodyTemplate());
        if (dto.getStatus() != null) t.setStatus(dto.getStatus());
        t.setVersion(t.getVersion() != null ? t.getVersion() + 1 : 1);

        CertificateTemplate saved = templateRepository.save(t);

        if (adminId != null) {
            userRepository.findById(adminId).ifPresent(admin ->
                    activityLogService.log(admin.getEmail(), admin.getName(), admin.getRole().name(),
                            "UPDATE", "CERTIFICATES", "TEMPLATE", String.valueOf(saved.getId()),
                            null, saved.getName(), "ADMIN updated certificate template: " + saved.getName() + " (v" + saved.getVersion() + ")")
            );
        }

        return toTemplateDTO(saved);
    }

    @Override
    @Transactional
    public AppDTO.CertificateTemplateDTO publishTemplate(Long id, Long adminId) {
        CertificateTemplate t = getTemplateById(id);
        t.setStatus("PUBLISHED");
        CertificateTemplate saved = templateRepository.save(t);
        if (adminId != null) {
            userRepository.findById(adminId).ifPresent(admin ->
                    activityLogService.log(admin.getEmail(), admin.getName(), admin.getRole().name(),
                            "PUBLISH", "CERTIFICATES", "TEMPLATE", String.valueOf(saved.getId()),
                            null, saved.getName(), "ADMIN published certificate template: " + saved.getName())
            );
        }
        return toTemplateDTO(saved);
    }

    @Override
    @Transactional
    public AppDTO.CertificateTemplateDTO archiveTemplate(Long id, Long adminId) {
        CertificateTemplate t = getTemplateById(id);
        t.setStatus("ARCHIVED");
        CertificateTemplate saved = templateRepository.save(t);
        if (adminId != null) {
            userRepository.findById(adminId).ifPresent(admin ->
                    activityLogService.log(admin.getEmail(), admin.getName(), admin.getRole().name(),
                            "ARCHIVE", "CERTIFICATES", "TEMPLATE", String.valueOf(saved.getId()),
                            null, saved.getName(), "ADMIN archived certificate template: " + saved.getName())
            );
        }
        return toTemplateDTO(saved);
    }

    @Override
    @Transactional
    public AppDTO.CertificateTemplateDTO duplicateTemplate(Long id, Long adminId) {
        CertificateTemplate original = getTemplateById(id);
        CertificateTemplate copy = CertificateTemplate.builder()
                .name(original.getName() + " (Copy)")
                .templateType(original.getTemplateType())
                .title(original.getTitle())
                .subtitle(original.getSubtitle())
                .collegeName(original.getCollegeName())
                .description(original.getDescription())
                .borderStyle(original.getBorderStyle())
                .borderWidth(original.getBorderWidth())
                .borderColor(original.getBorderColor())
                .fontFamily(original.getFontFamily())
                .fontSize(original.getFontSize())
                .fontWeight(original.getFontWeight())
                .textAlignment(original.getTextAlignment())
                .textColor(original.getTextColor())
                .primaryColor(original.getPrimaryColor())
                .secondaryColor(original.getSecondaryColor())
                .backgroundColor(original.getBackgroundColor())
                .signatoryTitle(original.getSignatoryTitle())
                .signatoryName(original.getSignatoryName())
                .signatory2Title(original.getSignatory2Title())
                .signatory2Name(original.getSignatory2Name())
                .logoUrl(original.getLogoUrl())
                .signatureUrl(original.getSignatureUrl())
                .bodyTemplate(original.getBodyTemplate())
                .status("DRAFT")
                .version(1)
                .build();
        return toTemplateDTO(templateRepository.save(copy));
    }

    @Override
    @Transactional
    public void deleteTemplate(Long id, Long adminId) {
        CertificateTemplate t = getTemplateById(id);
        templateRepository.delete(t);
        if (adminId != null) {
            userRepository.findById(adminId).ifPresent(admin ->
                    activityLogService.log(admin.getEmail(), admin.getName(), admin.getRole().name(),
                            "DELETE", "CERTIFICATES", "TEMPLATE", String.valueOf(id),
                            t.getName(), null, "ADMIN deleted certificate template: " + t.getName())
            );
        }
    }

    // ================= Certificate Generation & Revocation =================

    @Override
    @Transactional
    public AppDTO.CertificateDTO generateCertificate(AppDTO.GenerateCertificateRequest req, Long generatedByFacultyId) {
        Event event = eventRepository.findById(req.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + req.getEventId()));
        User student = userRepository.findById(req.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + req.getStudentId()));
        User faculty = generatedByFacultyId != null ? userRepository.findById(generatedByFacultyId).orElse(null) : null;

        CertificateTemplate template = null;
        if (req.getTemplateId() != null) {
            template = templateRepository.findById(req.getTemplateId()).orElse(null);
        }
        if (template == null) {
            template = templateRepository.findAll().stream().findFirst().orElse(null);
        }

        // Check if certificate already exists for this student & event
        Optional<Certificate> existing = certificateRepository.findByStudentIdAndEventId(student.getId(), event.getId());
        Certificate cert;

        if (existing.isPresent()) {
            cert = existing.get();
            // If already revoked, issue a new one with link
            if ("REVOKED".equalsIgnoreCase(cert.getStatus())) {
                int currentYear = LocalDate.now().getYear();
                String newCertId = generateCertificateId(currentYear);
                cert.setReplacedByCertificateId(newCertId);
                certificateRepository.save(cert);

                cert = Certificate.builder()
                        .certificateId(newCertId)
                        .student(student)
                        .event(event)
                        .template(template)
                        .templateVersion(template != null && template.getVersion() != null ? template.getVersion() : 1)
                        .certificateType(req.getCertificateType())
                        .position(req.getPosition() != null ? req.getPosition() : "Participant")
                        .issueDate(LocalDate.now())
                        .generatedBy(faculty)
                        .studentName(student.getName())
                        .eventName(event.getTitle())
                        .collegeName(DEFAULT_COLLEGE)
                        .departmentName(student.getDepartment() != null ? student.getDepartment() : student.getBranch())
                        .verificationUrl("/verify/certificate/" + newCertId)
                        .status("VALID")
                        .build();
            } else {
                cert.setCertificateType(req.getCertificateType());
                cert.setPosition(req.getPosition() != null ? req.getPosition() : "Participant");
                cert.setGeneratedBy(faculty);
                cert.setGeneratedAt(LocalDateTime.now());
                cert.setIssueDate(LocalDate.now());
                if (template != null) {
                    cert.setTemplate(template);
                    cert.setTemplateVersion(template.getVersion() != null ? template.getVersion() : 1);
                }
            }
        } else {
            int currentYear = LocalDate.now().getYear();
            String certId = generateCertificateId(currentYear);

            cert = Certificate.builder()
                    .certificateId(certId)
                    .student(student)
                    .event(event)
                    .template(template)
                    .templateVersion(template != null && template.getVersion() != null ? template.getVersion() : 1)
                    .certificateType(req.getCertificateType())
                    .position(req.getPosition() != null ? req.getPosition() : "Participant")
                    .issueDate(LocalDate.now())
                    .generatedBy(faculty)
                    .studentName(student.getName())
                    .eventName(event.getTitle())
                    .collegeName(DEFAULT_COLLEGE)
                    .departmentName(student.getDepartment() != null ? student.getDepartment() : student.getBranch())
                    .verificationUrl("/verify/certificate/" + certId)
                    .status("VALID")
                    .build();
        }

        Certificate saved = certificateRepository.save(cert);

        if (faculty != null) {
            activityLogService.log(faculty.getEmail(), faculty.getName(), faculty.getRole().name(),
                    "GENERATE", "CERTIFICATES", "CERTIFICATE", saved.getCertificateId(),
                    null, saved.getCertificateId(), faculty.getName() + " generated certificate " + saved.getCertificateId() + " for " + student.getName() + " (" + saved.getPosition() + ")");
        }

        return toDTO(saved);
    }

    @Override
    @Transactional
    public List<AppDTO.CertificateDTO> generateBatchCertificates(Long eventId, List<AppDTO.GenerateCertificateRequest> requests, Long facultyId) {
        List<AppDTO.CertificateDTO> results = new ArrayList<>();
        for (AppDTO.GenerateCertificateRequest req : requests) {
            req.setEventId(eventId);
            results.add(generateCertificate(req, facultyId));
        }
        return results;
    }

    @Override
    @Transactional
    public AppDTO.CertificateDTO revokeCertificate(Long certificateId, String reason, Long adminId) {
        Certificate cert = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found with ID: " + certificateId));

        User admin = adminId != null ? userRepository.findById(adminId).orElse(null) : null;

        cert.setStatus("REVOKED");
        cert.setRevocationReason(reason != null ? reason : "Revoked by Administrator");
        cert.setRevokedAt(LocalDateTime.now());
        cert.setRevokedBy(admin);

        Certificate saved = certificateRepository.save(cert);

        if (admin != null) {
            activityLogService.log(admin.getEmail(), admin.getName(), admin.getRole().name(),
                    "REVOKE", "CERTIFICATES", "CERTIFICATE", saved.getCertificateId(),
                    "VALID", "REVOKED", "ADMIN revoked certificate " + saved.getCertificateId() + ". Reason: " + cert.getRevocationReason());
        }

        return toDTO(saved);
    }

    @Override
    public byte[] generateCertificatePdfBytes(String certificateId) {
        Certificate cert = certificateRepository.findByCertificateId(certificateId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found with ID: " + certificateId));

        CertificateTemplate template = cert.getTemplate();
        if (template == null) {
            template = templateRepository.findAll().stream().findFirst().orElse(null);
        }

        return pdfCertificateService.generateCertificatePdf(cert, template);
    }

    // ================= Queries =================

    @Override
    public List<AppDTO.CertificateDTO> getAllCertificates() {
        return certificateRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.CertificateDTO> getCertificatesByStudent(Long studentId) {
        return certificateRepository.findByStudentId(studentId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.CertificateDTO> getCertificatesByEvent(Long eventId) {
        return certificateRepository.findByEventId(eventId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public AppDTO.CertificateDTO getCertificateByCode(String certificateId) {
        Certificate c = certificateRepository.findByCertificateId(certificateId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found with ID: " + certificateId));
        return toDTO(c);
    }

    @Override
    public AppDTO.CertificateDTO getCertificateById(Long id) {
        Certificate c = certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found with ID: " + id));
        return toDTO(c);
    }

    @Override
    public Map<String, Object> verifyCertificatePublic(String certificateId) {
        if (certificateId == null || certificateId.trim().isEmpty()) {
            Map<String, Object> res = new HashMap<>();
            res.put("status", "INVALID");
            res.put("isValid", false);
            res.put("certificateId", "");
            res.put("message", "This Certificate ID does not match any certificate issued by Aditya University.");
            return res;
        }

        Optional<Certificate> opt = certificateRepository.findByCertificateId(certificateId.trim());
        if (opt.isEmpty()) {
            Map<String, Object> res = new HashMap<>();
            res.put("status", "INVALID");
            res.put("isValid", false);
            res.put("certificateId", certificateId.trim());
            res.put("message", "This Certificate ID does not match any certificate issued by Aditya University.");
            return res;
        }

        Certificate c = opt.get();
        boolean isValid = "VALID".equalsIgnoreCase(c.getStatus());
        boolean isRevoked = "REVOKED".equalsIgnoreCase(c.getStatus());

        Map<String, Object> res = new HashMap<>();
        res.put("certificateId", c.getCertificateId());
        res.put("status", c.getStatus());
        res.put("isValid", isValid);

        if (isRevoked || !isValid) {
            res.put("isRevoked", true);
            res.put("message", "This certificate is no longer valid.");
            res.put("revocationReason", c.getRevocationReason() != null ? c.getRevocationReason() : "Administrative verification update");
            res.put("revokedAt", c.getRevokedAt() != null ? c.getRevokedAt().toString() : "");
            if (c.getReplacedByCertificateId() != null) {
                res.put("replacedByCertificateId", c.getReplacedByCertificateId());
            }
            return res;
        }

        // --- Only exposed when VALID ---
        res.put("issuedBy", "ADITYA UNIVERSITY");
        res.put("studentName", c.getStudentName());

        String studentIdVal = "";
        if (c.getStudent() != null) {
            if (c.getStudent().getStudentId() != null && !c.getStudent().getStudentId().isEmpty()) {
                studentIdVal = c.getStudent().getStudentId();
            } else if (c.getStudent().getRollNumber() != null) {
                studentIdVal = c.getStudent().getRollNumber();
            }
        }
        res.put("studentId", studentIdVal);
        res.put("eventName", c.getEventName());
        res.put("position", c.getPosition() != null ? c.getPosition() : c.getCertificateType());
        res.put("certificateType", c.getCertificateType());
        res.put("collegeName", c.getCollegeName() != null ? c.getCollegeName() : "ADITYA UNIVERSITY");

        String dept = c.getDepartmentName();
        if ((dept == null || dept.isEmpty()) && c.getStudent() != null) {
            dept = c.getStudent().getDepartment();
        }
        res.put("department", dept != null ? dept : "AI & ML");

        res.put("issueDate", c.getIssueDate() != null ? c.getIssueDate().toString() : "");
        res.put("verificationUrl", "/verify/certificate/" + c.getCertificateId());
        res.put("downloadUrl", "/api/certificates/" + c.getCertificateId() + "/download");

        if (c.getTemplate() != null) {
            res.put("templateTitle", c.getTemplate().getTitle());
            res.put("signatoryName", c.getTemplate().getSignatoryName());
            res.put("signatoryTitle", c.getTemplate().getSignatoryTitle());
            res.put("signatory2Name", c.getTemplate().getSignatory2Name());
            res.put("signatory2Title", c.getTemplate().getSignatory2Title());
        }

        return res;
    }
}
