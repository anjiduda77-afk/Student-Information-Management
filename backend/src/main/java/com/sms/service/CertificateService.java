package com.sms.service;

import com.sms.dto.AppDTO;
import com.sms.entity.CertificateTemplate;
import java.util.List;
import java.util.Map;

public interface CertificateService {
    // Template Management
    List<CertificateTemplate> getAllTemplates();
    List<AppDTO.CertificateTemplateDTO> getAllTemplateDTOs();
    CertificateTemplate getTemplateById(Long id);
    AppDTO.CertificateTemplateDTO getTemplateDTOById(Long id);
    CertificateTemplate saveTemplate(CertificateTemplate template);
    AppDTO.CertificateTemplateDTO createTemplate(AppDTO.CertificateTemplateDTO dto, Long adminId);
    AppDTO.CertificateTemplateDTO updateTemplate(Long id, AppDTO.CertificateTemplateDTO dto, Long adminId);
    AppDTO.CertificateTemplateDTO publishTemplate(Long id, Long adminId);
    AppDTO.CertificateTemplateDTO duplicateTemplate(Long id, Long adminId);
    void deleteTemplate(Long id, Long adminId);

    // Certificate Operations
    AppDTO.CertificateDTO generateCertificate(AppDTO.GenerateCertificateRequest request, Long generatedByFacultyId);
    List<AppDTO.CertificateDTO> generateBatchCertificates(Long eventId, List<AppDTO.GenerateCertificateRequest> requests, Long facultyId);
    AppDTO.CertificateDTO revokeCertificate(Long certificateId, String reason, Long adminId);
    byte[] generateCertificatePdfBytes(String certificateId);

    // Queries
    List<AppDTO.CertificateDTO> getAllCertificates();
    List<AppDTO.CertificateDTO> getCertificatesByStudent(Long studentId);
    List<AppDTO.CertificateDTO> getCertificatesByEvent(Long eventId);
    AppDTO.CertificateDTO getCertificateByCode(String certificateId);
    AppDTO.CertificateDTO getCertificateById(Long id);
    Map<String, Object> verifyCertificatePublic(String certificateId);
}
