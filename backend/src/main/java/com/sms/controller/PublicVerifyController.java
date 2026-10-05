package com.sms.controller;

import com.sms.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/verify", "/api/public/verify"})
@RequiredArgsConstructor
public class PublicVerifyController {

    private final CertificateService certificateService;

    @GetMapping({"/certificate/{certificateId}", "/certificate", "/{certificateId}", ""})
    public ResponseEntity<?> verifyCertificate(
            @PathVariable(required = false) String certificateId,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String certId) {
        String id = (certificateId != null && !certificateId.trim().isEmpty())
                ? certificateId
                : (code != null && !code.trim().isEmpty() ? code : certId);
        return ResponseEntity.ok(certificateService.verifyCertificatePublic(id));
    }
}
