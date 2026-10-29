package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.FeeRecord;
import com.sms.entity.FeeStructure;
import com.sms.entity.User;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.FeeRepository;
import com.sms.repository.FeeStructureRepository;
import com.sms.repository.UserRepository;
import com.sms.service.FeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeeServiceImpl implements FeeService {

    private final FeeStructureRepository feeStructureRepository;
    private final FeeRepository feeRepository;
    private final UserRepository userRepository;

    @Override
    public List<AppDTO.FeeStructureDTO> getAllStructures() {
        seedDefaultFeesIfEmpty();
        return feeStructureRepository.findAll().stream()
                .map(AppDTO.FeeStructureDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppDTO.FeeStructureDTO createStructure(AppDTO.FeeStructureDTO dto) {
        FeeStructure fs = FeeStructure.builder()
                .name(dto.getName())
                .category(FeeStructure.FeeCategory.valueOf(dto.getCategory().toUpperCase()))
                .academicYear(dto.getAcademicYear() != null ? dto.getAcademicYear() : "2026-27")
                .department(dto.getDepartment())
                .semester(dto.getSemester())
                .amount(dto.getAmount())
                .dueDate(dto.getDueDate() != null ? dto.getDueDate() : LocalDate.now().plusMonths(1))
                .lateFinePerDay(dto.getLateFinePerDay() != null ? dto.getLateFinePerDay() : BigDecimal.ZERO)
                .description(dto.getDescription())
                .status(FeeStructure.Status.ACTIVE)
                .build();
        return AppDTO.FeeStructureDTO.from(feeStructureRepository.save(fs));
    }

    @Override
    @Transactional
    public List<AppDTO.FeeRecordDTO> getStudentFeeRecords(Long studentId) {
        seedDefaultFeesIfEmpty();
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        // Ensure records exist for all active fee structures
        List<FeeStructure> structures = feeStructureRepository.findByStatus(FeeStructure.Status.ACTIVE);
        for (FeeStructure fs : structures) {
            Optional<FeeRecord> existing = feeRepository.findByStudentIdAndFeeStructureId(studentId, fs.getId());
            if (existing.isEmpty()) {
                FeeRecord rec = FeeRecord.builder()
                        .student(student)
                        .feeStructure(fs)
                        .amountDue(fs.getAmount())
                        .amountPaid(BigDecimal.ZERO)
                        .lateFine(BigDecimal.ZERO)
                        .concession(BigDecimal.ZERO)
                        .status(FeeRecord.PaymentStatus.PENDING)
                        .build();
                feeRepository.save(rec);
            }
        }

        return feeRepository.findAllByStudentIdOrderByCreatedAtDesc(studentId).stream()
                .map(AppDTO.FeeRecordDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppDTO.FeeRecordDTO payFee(AppDTO.FeePaymentRequest req, Long collectedByUserId) {
        User student = userRepository.findById(req.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + req.getStudentId()));
        FeeStructure fs = feeStructureRepository.findById(req.getFeeStructureId())
                .orElseThrow(() -> new ResourceNotFoundException("Fee structure not found: " + req.getFeeStructureId()));

        FeeRecord rec = feeRepository.findByStudentIdAndFeeStructureId(student.getId(), fs.getId())
                .orElseGet(() -> FeeRecord.builder()
                        .student(student)
                        .feeStructure(fs)
                        .amountDue(fs.getAmount())
                        .amountPaid(BigDecimal.ZERO)
                        .status(FeeRecord.PaymentStatus.PENDING)
                        .build());

        BigDecimal newPaid = (rec.getAmountPaid() != null ? rec.getAmountPaid() : BigDecimal.ZERO).add(req.getAmountPaid());
        rec.setAmountPaid(newPaid);
        rec.setPaymentMode(req.getPaymentMode());
        rec.setPaymentDate(req.getPaymentDate() != null ? req.getPaymentDate() : LocalDate.now());

        if (req.getTransactionReference() != null && !req.getTransactionReference().isBlank()) {
            rec.setTransactionReference(req.getTransactionReference());
        } else {
            rec.setTransactionReference("TXN-" + System.currentTimeMillis() % 10000000);
        }

        if (rec.getReceiptNumber() == null) {
            rec.setReceiptNumber("AU-FEE-" + LocalDate.now().getYear() + "-" + String.format("%05d", (int)(Math.random() * 90000 + 10000)));
        }

        if (collectedByUserId != null) {
            userRepository.findById(collectedByUserId).ifPresent(rec::setCollectedBy);
        }

        if (rec.getRemarks() == null || rec.getRemarks().isBlank()) {
            rec.setRemarks(req.getRemarks() != null ? req.getRemarks() : "Payment received online via " + req.getPaymentMode());
        }

        BigDecimal balance = rec.getAmountDue().subtract(newPaid).subtract(rec.getConcession() != null ? rec.getConcession() : BigDecimal.ZERO);
        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            rec.setStatus(FeeRecord.PaymentStatus.PAID);
        } else {
            rec.setStatus(FeeRecord.PaymentStatus.PARTIAL);
        }

        FeeRecord saved = feeRepository.save(rec);
        return AppDTO.FeeRecordDTO.from(saved);
    }

    @Override
    public AppDTO.FeeRecordDTO getReceiptByNumber(String receiptNumber) {
        FeeRecord rec = feeRepository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found: " + receiptNumber));
        return AppDTO.FeeRecordDTO.from(rec);
    }

    @Override
    public AppDTO.FeeOverviewDTO getOverview() {
        seedDefaultFeesIfEmpty();
        long totalStructures = feeStructureRepository.count();
        long totalRecords = feeRepository.count();
        long paidCount = feeRepository.countByStatus(FeeRecord.PaymentStatus.PAID);
        long pendingCount = feeRepository.countByStatus(FeeRecord.PaymentStatus.PENDING);
        long overdueCount = feeRepository.countByStatus(FeeRecord.PaymentStatus.OVERDUE);

        BigDecimal collected = feeRepository.sumCollectedAmount();
        BigDecimal outstanding = feeRepository.sumOutstandingAmount();
        BigDecimal totalDue = collected.add(outstanding);
        double collectionPct = totalDue.compareTo(BigDecimal.ZERO) > 0
                ? (collected.doubleValue() / totalDue.doubleValue()) * 100
                : 0.0;

        List<AppDTO.FeeStructureDTO> recent = feeStructureRepository.findAll().stream()
                .map(AppDTO.FeeStructureDTO::from)
                .limit(5)
                .collect(Collectors.toList());

        return AppDTO.FeeOverviewDTO.builder()
                .totalStructures(totalStructures)
                .totalRecords(totalRecords)
                .paidCount(paidCount)
                .pendingCount(pendingCount)
                .overdueCount(overdueCount)
                .totalCollected(collected)
                .totalOutstanding(outstanding)
                .totalDue(totalDue)
                .collectionPercentage(Math.round(collectionPct * 10.0) / 10.0)
                .recentStructures(recent)
                .build();
    }

    @Override
    @Transactional
    public synchronized void seedDefaultFeesIfEmpty() {
        if (feeStructureRepository.count() > 0) return;

        List<FeeStructure> defaults = List.of(
                FeeStructure.builder()
                        .name("B.Tech Autonomous Academic Tuition Fee – Odd Sem")
                        .category(FeeStructure.FeeCategory.TUITION)
                        .academicYear("2026-27")
                        .amount(new BigDecimal("65000.00"))
                        .dueDate(LocalDate.of(2026, 11, 30))
                        .description("Regular semester academic tuition and state-of-the-art laboratory access fees.")
                        .status(FeeStructure.Status.ACTIVE)
                        .build(),
                FeeStructure.builder()
                        .name("Semester End Examination (SEE) & Evaluation Fee")
                        .category(FeeStructure.FeeCategory.EXAM)
                        .academicYear("2026-27")
                        .amount(new BigDecimal("2500.00"))
                        .dueDate(LocalDate.of(2026, 11, 25))
                        .description("Examination hall ticket, theory evaluation, and practical laboratory assessment fee.")
                        .status(FeeStructure.Status.ACTIVE)
                        .build(),
                FeeStructure.builder()
                        .name("University Transit Bus Pass – Route 14 (Campus Express)")
                        .category(FeeStructure.FeeCategory.TRANSPORT)
                        .academicYear("2026-27")
                        .amount(new BigDecimal("18000.00"))
                        .dueDate(LocalDate.of(2026, 11, 20))
                        .description("Air-conditioned university transit service covering central city corridors to campus.")
                        .status(FeeStructure.Status.ACTIVE)
                        .build(),
                FeeStructure.builder()
                        .name("Hostel Accommodation & Campus Mess Fee")
                        .category(FeeStructure.FeeCategory.HOSTEL)
                        .academicYear("2026-27")
                        .amount(new BigDecimal("35000.00"))
                        .dueDate(LocalDate.of(2026, 12, 5))
                        .description("Campus residential block accommodation and hygienic dietary dining facilities.")
                        .status(FeeStructure.Status.ACTIVE)
                        .build()
        );

        feeStructureRepository.saveAll(defaults);
    }
}

