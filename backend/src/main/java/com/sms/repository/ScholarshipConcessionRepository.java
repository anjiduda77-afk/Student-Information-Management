package com.sms.repository;

import com.sms.entity.ScholarshipConcession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScholarshipConcessionRepository extends JpaRepository<ScholarshipConcession, Long> {
    List<ScholarshipConcession> findByStudentId(Long studentId);
    List<ScholarshipConcession> findByFeeStructureId(Long feeStructureId);
    List<ScholarshipConcession> findByStatus(String status);
}
