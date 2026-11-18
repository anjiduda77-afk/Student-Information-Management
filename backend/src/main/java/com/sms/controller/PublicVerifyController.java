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
            @RequestParam(required = false) String certId,
            @RequestParam(required = false) String id,
            @RequestParam(required = false) String url,
            @RequestParam(required = false) java.util.Map<String, String> allParams) {
        String direct = (certificateId != null && !certificateId.trim().isEmpty())
                ? certificateId
                : (url != null && !url.trim().isEmpty()
                    ? url
                    : (id != null && !id.trim().isEmpty()
                        ? id
                        : (code != null && !code.trim().isEmpty() ? code : certId)));
        String resolvedId = com.sms.util.UrlRequestParamResolver.resolveCertificateId(direct, allParams);
        return ResponseEntity.ok(certificateService.verifyCertificatePublic(resolvedId));
    }
}
