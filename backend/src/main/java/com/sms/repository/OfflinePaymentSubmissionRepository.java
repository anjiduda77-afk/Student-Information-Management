package com.sms.repository;

import com.sms.entity.OfflinePaymentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfflinePaymentSubmissionRepository extends JpaRepository<OfflinePaymentSubmission, Long> {
    List<OfflinePaymentSubmission> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<OfflinePaymentSubmission> findByStatusOrderByCreatedAtDesc(String status);
}
