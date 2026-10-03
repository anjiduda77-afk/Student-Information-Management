package com.sms.controller;

import com.sms.dto.AppDTO;
import com.sms.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping("/verify/{certificateId}")
    public ResponseEntity<?> verifyCertificate(@PathVariable String certificateId) {
        return ResponseEntity.ok(certificateService.verifyCertificatePublic(certificateId));
    }

    @GetMapping("/{certificateId}")
    public ResponseEntity<?> getCertificate(@PathVariable String certificateId) {
        return ResponseEntity.ok(certificateService.getCertificateByCode(certificateId));
    }

    @GetMapping("/templates")
    public ResponseEntity<?> getTemplates() {
        return ResponseEntity.ok(certificateService.getAllTemplates());
    }
}
