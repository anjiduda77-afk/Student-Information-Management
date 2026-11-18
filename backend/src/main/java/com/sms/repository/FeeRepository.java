package com.sms.repository;

import com.sms.entity.FeeRecord;
import com.sms.entity.FeeStructure;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
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
    BigDecimal sumCollectedAmount();

    @Query("SELECT COALESCE(SUM(fr.amountDue - fr.amountPaid - fr.concession), 0) " +
           "FROM FeeRecord fr WHERE fr.status IN ('PENDING', 'PARTIAL', 'OVERDUE')")
    BigDecimal sumOutstandingAmount();

    @Query("SELECT fr FROM FeeRecord fr " +
           "JOIN fr.student s " +
           "WHERE (:department IS NULL OR s.department = :department OR s.branch = :department) " +
           "AND (:semester IS NULL OR s.semester = :semester) " +
           "AND (:status IS NULL OR fr.status = :status)")
    Page<FeeRecord> findClearanceRecords(
            @Param("department") String department,
            @Param("semester") Integer semester,
            @Param("status") FeeRecord.PaymentStatus status,
            Pageable pageable);

    @Query("SELECT fr FROM FeeRecord fr " +
           "JOIN fr.student s " +
           "JOIN fr.feeStructure fs " +
           "WHERE (:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.rollNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(fr.receiptNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(fr.transactionReference) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:category IS NULL OR fs.category = :category) " +
           "AND (:status IS NULL OR fr.status = :status) " +
           "AND (:department IS NULL OR s.department = :department OR s.branch = :department)")
    Page<FeeRecord> findAdminFeeRecords(
            @Param("search") String search,
            @Param("category") FeeStructure.FeeCategory category,
            @Param("status") FeeRecord.PaymentStatus status,
            @Param("department") String department,
            Pageable pageable);
}
