package com.sms.repository;

import com.sms.entity.CertificateTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CertificateTemplateRepository extends JpaRepository<CertificateTemplate, Long> {
    Optional<CertificateTemplate> findByName(String name);
    List<CertificateTemplate> findByTemplateType(CertificateTemplate.TemplateType templateType);
}
