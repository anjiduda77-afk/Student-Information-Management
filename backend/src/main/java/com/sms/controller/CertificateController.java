package com.sms.controller;

import com.sms.dto.AppDTO;
import com.sms.entity.User;
import com.sms.repository.UserRepository;
import com.sms.service.CertificateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;
    private final UserRepository userRepository;

    private User getUser(UserDetails ud) {
        if (ud == null) return null;
        return userRepository.findByEmail(ud.getUsername()).orElse(null);
    }

    // ==================== Public Verification ====================

    @GetMapping("/verify/{certificateId}")
    public ResponseEntity<?> verifyCertificate(@PathVariable String certificateId) {
        return ResponseEntity.ok(certificateService.verifyCertificatePublic(certificateId));
    }

    // ==================== Templates CRUD (Admin Only) ====================

    @GetMapping("/templates")
    public ResponseEntity<List<AppDTO.CertificateTemplateDTO>> getTemplates() {
        return ResponseEntity.ok(certificateService.getAllTemplateDTOs());
    }

    @GetMapping("/templates/{id}")
    public ResponseEntity<?> getTemplate(@PathVariable Long id) {
        return ResponseEntity.ok(certificateService.getTemplateDTOById(id));
    }

    @PostMapping("/templates")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createTemplate(@Valid @RequestBody AppDTO.CertificateTemplateDTO req,
                                            @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        return ResponseEntity.ok(certificateService.createTemplate(req, u != null ? u.getId() : null));
    }

    @PutMapping("/templates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateTemplate(@PathVariable Long id,
                                            @Valid @RequestBody AppDTO.CertificateTemplateDTO req,
                                            @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        return ResponseEntity.ok(certificateService.updateTemplate(id, req, u != null ? u.getId() : null));
    }

    @PostMapping("/templates/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> publishTemplate(@PathVariable Long id,
                                             @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        return ResponseEntity.ok(certificateService.publishTemplate(id, u != null ? u.getId() : null));
    }

    @PostMapping("/templates/{id}/duplicate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> duplicateTemplate(@PathVariable Long id,
                                               @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        return ResponseEntity.ok(certificateService.duplicateTemplate(id, u != null ? u.getId() : null));
    }

    @DeleteMapping("/templates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTemplate(@PathVariable Long id,
                                            @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        certificateService.deleteTemplate(id, u != null ? u.getId() : null);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Certificate template deleted successfully"));
    }

    // ==================== Certificate Records & Download ====================

    @GetMapping
    public ResponseEntity<List<AppDTO.CertificateDTO>> getAllCertificates() {
        return ResponseEntity.ok(certificateService.getAllCertificates());
    }

    @GetMapping("/{certificateId}")
    public ResponseEntity<?> getCertificate(@PathVariable String certificateId) {
        return ResponseEntity.ok(certificateService.getCertificateByCode(certificateId));
    }

    @GetMapping("/{certificateId}/download")
    public ResponseEntity<byte[]> downloadCertificatePdf(@PathVariable String certificateId) {
        byte[] pdfBytes = certificateService.generateCertificatePdfBytes(certificateId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "Certificate-" + certificateId + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @PostMapping("/{id}/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> revokeCertificate(@PathVariable Long id,
                                               @RequestBody(required = false) AppDTO.RevokeCertificateRequest req,
                                               @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        String reason = req != null ? req.getReason() : "Revoked by Administrator";
        return ResponseEntity.ok(certificateService.revokeCertificate(id, reason, u != null ? u.getId() : null));
    }
}
