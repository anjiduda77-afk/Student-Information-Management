package com.sms.repository;

import com.sms.entity.FeeRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeeRepository extends JpaRepository<FeeRecord, Long> {

    List<FeeRecord> findByStudentId(Long studentId);

    List<FeeRecord> findByStatus(FeeRecord.PaymentStatus status);

    Optional<FeeRecord> findByStudentIdAndFeeStructureId(Long studentId, Long feeStructureId);

    Optional<FeeRecord> findByReceiptNumber(String receiptNumber);

    List<FeeRecord> findByFeeStructureId(Long feeStructureId);

    @Query("SELECT fr FROM FeeRecord fr WHERE fr.student.id = :studentId ORDER BY fr.createdAt DESC")
    List<FeeRecord> findAllByStudentIdOrderByCreatedAtDesc(@Param("studentId") Long studentId);

    @Query("SELECT fr FROM FeeRecord fr " +
           "JOIN fr.feeStructure fs " +
           "WHERE fs.academicYear = :academicYear " +
           "ORDER BY fr.student.name ASC")
    List<FeeRecord> findAllByAcademicYear(@Param("academicYear") String academicYear);

    @Query("SELECT COUNT(fr) FROM FeeRecord fr WHERE fr.status = :status")
    long countByStatus(@Param("status") FeeRecord.PaymentStatus status);

    @Query("SELECT COALESCE(SUM(fr.amountPaid), 0) FROM FeeRecord fr WHERE fr.status = 'PAID'")
    java.math.BigDecimal sumCollectedAmount();

    @Query("SELECT COALESCE(SUM(fr.amountDue - fr.amountPaid - fr.concession), 0) " +
           "FROM FeeRecord fr WHERE fr.status IN ('PENDING', 'PARTIAL', 'OVERDUE')")
    java.math.BigDecimal sumOutstandingAmount();
}
