package com.sms.service;

import com.sms.dto.AppDTO;
import com.sms.entity.CertificateTemplate;
import java.util.List;
import java.util.Map;

public interface CertificateService {
    List<CertificateTemplate> getAllTemplates();
    CertificateTemplate getTemplateById(Long id);
    CertificateTemplate saveTemplate(CertificateTemplate template);

    AppDTO.CertificateDTO generateCertificate(AppDTO.GenerateCertificateRequest request, Long generatedByFacultyId);
    List<AppDTO.CertificateDTO> generateBatchCertificates(Long eventId, List<AppDTO.GenerateCertificateRequest> requests, Long facultyId);

    List<AppDTO.CertificateDTO> getCertificatesByStudent(Long studentId);
    List<AppDTO.CertificateDTO> getCertificatesByEvent(Long eventId);
    AppDTO.CertificateDTO getCertificateByCode(String certificateId);

    Map<String, Object> verifyCertificatePublic(String certificateId);
}
