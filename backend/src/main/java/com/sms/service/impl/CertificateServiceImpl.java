package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.*;
import com.sms.exception.ConflictException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import com.sms.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CertificateServiceImpl implements CertificateService {

    private final CertificateRepository certificateRepository;
    private final CertificateTemplateRepository templateRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    private static final String DEFAULT_COLLEGE = "APEX INSTITUTE OF TECHNOLOGY & SCIENCE";

    private String generateCertificateId(int year) {
        // e.g. SIS-EVT-2026-00001
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
                .certificateType(c.getCertificateType())
                .position(c.getPosition())
                .issueDate(c.getIssueDate())
                .collegeName(c.getCollegeName())
                .departmentName(c.getDepartmentName())
                .verificationUrl(c.getVerificationUrl())
                .status(c.getStatus())
                .signatoryName("Dr. Priya Sharma")
                .signatoryTitle("Dean of Academic Affairs & Faculty Convener")
                .build();
    }

    @Override
    public List<CertificateTemplate> getAllTemplates() {
        return templateRepository.findAll();
    }

    @Override
    public CertificateTemplate getTemplateById(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate template not found"));
    }

    @Override
    @Transactional
    public CertificateTemplate saveTemplate(CertificateTemplate template) {
        return templateRepository.save(template);
    }

    @Override
    @Transactional
    public AppDTO.CertificateDTO generateCertificate(AppDTO.GenerateCertificateRequest req, Long generatedByFacultyId) {
        Event event = eventRepository.findById(req.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        User student = userRepository.findById(req.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        User faculty = generatedByFacultyId != null ? userRepository.findById(generatedByFacultyId).orElse(null) : null;

        // Check if certificate already issued for this student & event -> regenerate/update
        Optional<Certificate> existing = certificateRepository.findByStudentIdAndEventId(student.getId(), event.getId());
        Certificate cert;

        if (existing.isPresent()) {
            cert = existing.get();
            cert.setCertificateType(req.getCertificateType());
            cert.setPosition(req.getPosition() != null ? req.getPosition() : "Participant");
            cert.setGeneratedBy(faculty);
            cert.setGeneratedAt(LocalDateTime.now());
            cert.setIssueDate(LocalDate.now());
        } else {
            int currentYear = LocalDate.now().getYear();
            String certId = generateCertificateId(currentYear);

            cert = Certificate.builder()
                    .certificateId(certId)
                    .student(student)
                    .event(event)
                    .certificateType(req.getCertificateType())
                    .position(req.getPosition() != null ? req.getPosition() : "Participant")
                    .issueDate(LocalDate.now())
                    .generatedBy(faculty)
                    .studentName(student.getName())
                    .eventName(event.getTitle())
                    .collegeName(DEFAULT_COLLEGE)
                    .departmentName(student.getDepartment() != null ? student.getDepartment() : "Engineering")
                    .verificationUrl("/verify-certificate?id=" + certId)
                    .status("VALID")
                    .build();
        }

        Certificate saved = certificateRepository.save(cert);
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
    public Map<String, Object> verifyCertificatePublic(String certificateId) {
        Optional<Certificate> opt = certificateRepository.findByCertificateId(certificateId.trim());
        if (opt.isEmpty()) {
            return Map.of(
                    "status", "INVALID",
                    "message", "No record found for Certificate ID: " + certificateId
            );
        }

        Certificate c = opt.get();
        // Public details without exposing personal sensitive data like phone/address
        return Map.of(
                "status", "VALID",
                "certificateId", c.getCertificateId(),
                "studentName", c.getStudentName(),
                "eventName", c.getEventName(),
                "position", c.getPosition() != null ? c.getPosition() : c.getCertificateType(),
                "certificateType", c.getCertificateType(),
                "collegeName", c.getCollegeName(),
                "issueDate", c.getIssueDate().toString(),
                "verificationStatus", "VALID OFFICIAL CERTIFICATE"
        );
    }
}
