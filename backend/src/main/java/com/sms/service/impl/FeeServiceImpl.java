package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.*;
import com.sms.exception.BadRequestException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import com.sms.service.FeeService;
import com.sms.service.PdfFeeReceiptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeeServiceImpl implements FeeService {

    private final FeeStructureRepository feeStructureRepository;
    private final FeeRepository feeRepository;
    private final UserRepository userRepository;
    private final FeeCategoryRepository feeCategoryRepository;
    private final ScholarshipConcessionRepository scholarshipConcessionRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final OfflinePaymentSubmissionRepository offlinePaymentSubmissionRepository;
    private final NotificationRepository notificationRepository;
    private final PdfFeeReceiptService pdfFeeReceiptService;

    // ================= Category Management =================

    @Override
    public List<AppDTO.FeeCategoryDTO> getAllCategories() {
        seedDefaultCategoriesIfEmpty();
        return feeCategoryRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
                .map(this::toCategoryDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppDTO.FeeCategoryDTO createCategory(AppDTO.FeeCategoryDTO dto) {
        if (dto.getCode() == null || dto.getCode().trim().isEmpty()) {
            throw new BadRequestException("Fee category code is mandatory");
        }
        String cleanCode = dto.getCode().trim().toUpperCase().replace(" ", "_");
        if (feeCategoryRepository.existsByCode(cleanCode)) {
            throw new BadRequestException("Fee category code '" + cleanCode + "' already exists");
        }
        FeeCategory cat = FeeCategory.builder()
                .code(cleanCode)
                .name(dto.getName() != null ? dto.getName().trim() : cleanCode)
                .description(dto.getDescription())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();
        return toCategoryDTO(feeCategoryRepository.save(cat));
    }

    @Override
    @Transactional
    public AppDTO.FeeCategoryDTO toggleCategory(Long id) {
        FeeCategory cat = feeCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fee category not found with id: " + id));
        cat.setIsActive(!Boolean.TRUE.equals(cat.getIsActive()));
        return toCategoryDTO(feeCategoryRepository.save(cat));
    }

    private AppDTO.FeeCategoryDTO toCategoryDTO(FeeCategory c) {
        return AppDTO.FeeCategoryDTO.builder()
                .id(c.getId())
                .code(c.getCode())
                .name(c.getName())
                .description(c.getDescription())
                .isActive(c.getIsActive())
                .createdAt(c.getCreatedAt())
                .build();
    }

    // ================= Structure Management =================

    @Override
    public List<AppDTO.FeeStructureDTO> getAllStructures() {
        seedDefaultFeesIfEmpty();
        return feeStructureRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .map(AppDTO.FeeStructureDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppDTO.FeeStructureDTO createStructure(AppDTO.FeeStructureDTO dto) {
        FeeStructure.FeeCategory catEnum = resolveCategoryEnum(dto.getCategory());
        String catCode = dto.getCategoryCode() != null && !dto.getCategoryCode().isBlank()
                ? dto.getCategoryCode().trim().toUpperCase()
                : (dto.getCategory() != null ? dto.getCategory().toUpperCase() : "TUITION");

        FeeStructure fs = FeeStructure.builder()
                .name(dto.getName())
                .category(catEnum)
                .categoryCode(catCode)
                .academicYear(dto.getAcademicYear() != null && !dto.getAcademicYear().isBlank() ? dto.getAcademicYear() : "2026-27")
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
    public AppDTO.FeeStructureDTO updateStructure(Long id, AppDTO.FeeStructureDTO dto) {
        FeeStructure fs = feeStructureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fee structure not found with id: " + id));

        if (dto.getName() != null && !dto.getName().isBlank()) fs.setName(dto.getName());
        if (dto.getCategory() != null) {
            fs.setCategory(resolveCategoryEnum(dto.getCategory()));
        }
        if (dto.getCategoryCode() != null) {
            fs.setCategoryCode(dto.getCategoryCode().toUpperCase());
        }
        if (dto.getAcademicYear() != null) fs.setAcademicYear(dto.getAcademicYear());
        fs.setDepartment(dto.getDepartment());
        fs.setSemester(dto.getSemester());
        if (dto.getAmount() != null) fs.setAmount(dto.getAmount());
        if (dto.getDueDate() != null) fs.setDueDate(dto.getDueDate());
        if (dto.getLateFinePerDay() != null) fs.setLateFinePerDay(dto.getLateFinePerDay());
        if (dto.getDescription() != null) fs.setDescription(dto.getDescription());
        if (dto.getStatus() != null) {
            try {
                fs.setStatus(FeeStructure.Status.valueOf(dto.getStatus().toUpperCase()));
            } catch (Exception ignored) {}
        }

        return AppDTO.FeeStructureDTO.from(feeStructureRepository.save(fs));
    }

    @Override
    @Transactional
    public void deleteStructure(Long id) {
        FeeStructure fs = feeStructureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fee structure not found with id: " + id));
        List<FeeRecord> records = feeRepository.findByFeeStructureId(id);
        if (!records.isEmpty()) {
            // Soft delete to protect financial audit history
            fs.setStatus(FeeStructure.Status.INACTIVE);
            feeStructureRepository.save(fs);
            log.info("FeeStructure ID {} has {} linked records; soft-deactivated to preserve ledger audit trail", id, records.size());
        } else {
            feeStructureRepository.delete(fs);
        }
    }

    @Override
    @Transactional
    public AppDTO.BulkFeeAssignResult bulkAssignFee(AppDTO.BulkFeeAssignRequest req) {
        FeeStructure fs = feeStructureRepository.findById(req.getFeeStructureId())
                .orElseThrow(() -> new ResourceNotFoundException("Fee structure not found with ID: " + req.getFeeStructureId()));

        String dept = (req.getDepartment() != null && !req.getDepartment().isBlank() && !"ALL".equalsIgnoreCase(req.getDepartment()))
                ? req.getDepartment().trim() : null;
        Integer sem = req.getSemester() != null && req.getSemester() > 0 ? req.getSemester() : null;
        String sec = (req.getSection() != null && !req.getSection().isBlank() && !"ALL".equalsIgnoreCase(req.getSection()))
                ? req.getSection().trim() : null;

        List<User> students = userRepository.findStudentsForBulkAssignment(dept, sem, sec);
        int totalMatched = students.size();
        int newlyAssigned = 0;
        int alreadyAssigned = 0;

        List<FeeRecord> toSave = new ArrayList<>();
        for (User s : students) {
            Optional<FeeRecord> existing = feeRepository.findByStudentIdAndFeeStructureId(s.getId(), fs.getId());
            if (existing.isPresent()) {
                alreadyAssigned++;
            } else {
                FeeRecord rec = FeeRecord.builder()
                        .student(s)
                        .feeStructure(fs)
                        .amountDue(fs.getAmount())
                        .amountPaid(BigDecimal.ZERO)
                        .lateFine(BigDecimal.ZERO)
                        .concession(BigDecimal.ZERO)
                        .status(FeeRecord.PaymentStatus.PENDING)
                        .build();
                toSave.add(rec);
                newlyAssigned++;
            }
        }

        if (!toSave.isEmpty()) {
            feeRepository.saveAll(toSave);
        }

        return AppDTO.BulkFeeAssignResult.builder()
                .totalMatched(totalMatched)
                .newlyAssigned(newlyAssigned)
                .alreadyAssigned(alreadyAssigned)
                .feeStructureName(fs.getName())
                .build();
    }

    // ================= Student Fee Records =================

    @Override
    @Transactional
    public List<AppDTO.FeeRecordDTO> getStudentFeeRecords(Long studentId) {
        seedDefaultFeesIfEmpty();
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        // Ensure active structures applicable to all or this student's department/semester are instantiated
        List<FeeStructure> activeStructures = feeStructureRepository.findByStatus(FeeStructure.Status.ACTIVE);
        for (FeeStructure fs : activeStructures) {
            boolean deptMatches = fs.getDepartment() == null || fs.getDepartment().isBlank()
                    || fs.getDepartment().equalsIgnoreCase(student.getDepartment())
                    || fs.getDepartment().equalsIgnoreCase(student.getBranch());
            boolean semMatches = fs.getSemester() == null || fs.getSemester().equals(student.getSemester());

            if (deptMatches && semMatches) {
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
            rec.setReceiptNumber(generateReceiptNumber());
        }

        if (collectedByUserId != null) {
            userRepository.findById(collectedByUserId).ifPresent(rec::setCollectedBy);
        }

        if (rec.getRemarks() == null || rec.getRemarks().isBlank()) {
            rec.setRemarks(req.getRemarks() != null ? req.getRemarks() : "Payment received via " + req.getPaymentMode());
        }

        BigDecimal concession = rec.getConcession() != null ? rec.getConcession() : BigDecimal.ZERO;
        BigDecimal balance = rec.getAmountDue().subtract(newPaid).subtract(concession);
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
                .orElseThrow(() -> new ResourceNotFoundException("Receipt record not found with number: " + receiptNumber));
        return AppDTO.FeeRecordDTO.from(rec);
    }

    @Override
    public byte[] generateFeeReceiptPdfBytes(String receiptNumber) {
        FeeRecord rec = feeRepository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found for PDF export: " + receiptNumber));
        return pdfFeeReceiptService.generateFeeReceiptPdf(rec);
    }

    // ================= Scholarships & Concessions =================

    @Override
    @Transactional
    public AppDTO.ScholarshipConcessionDTO addConcession(AppDTO.AddConcessionRequest req, Long approvedByUserId) {
        User student = userRepository.findById(req.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + req.getStudentId()));
        FeeStructure fs = feeStructureRepository.findById(req.getFeeStructureId())
                .orElseThrow(() -> new ResourceNotFoundException("Fee structure not found with ID: " + req.getFeeStructureId()));

        User approvedBy = approvedByUserId != null ? userRepository.findById(approvedByUserId).orElse(null) : null;

        ScholarshipConcession sc = ScholarshipConcession.builder()
                .student(student)
                .feeStructure(fs)
                .concessionType(req.getConcessionType() != null ? req.getConcessionType().toUpperCase() : "SPECIAL")
                .discountPercentage(req.getDiscountPercentage())
                .amount(req.getAmount())
                .reason(req.getReason())
                .approvedBy(approvedBy)
                .status("APPROVED")
                .supportingDocumentUrl(req.getSupportingDocumentUrl())
                .build();
        sc = scholarshipConcessionRepository.save(sc);

        // Adjust student fee record
        FeeRecord rec = feeRepository.findByStudentIdAndFeeStructureId(student.getId(), fs.getId())
                .orElseGet(() -> FeeRecord.builder()
                        .student(student)
                        .feeStructure(fs)
                        .amountDue(fs.getAmount())
                        .amountPaid(BigDecimal.ZERO)
                        .lateFine(BigDecimal.ZERO)
                        .concession(BigDecimal.ZERO)
                        .status(FeeRecord.PaymentStatus.PENDING)
                        .build());

        BigDecimal newConcession = (rec.getConcession() != null ? rec.getConcession() : BigDecimal.ZERO).add(req.getAmount());
        rec.setConcession(newConcession);

        BigDecimal paid = rec.getAmountPaid() != null ? rec.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal balance = rec.getAmountDue().subtract(paid).subtract(newConcession);
        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            if (paid.compareTo(BigDecimal.ZERO) == 0) {
                rec.setStatus(FeeRecord.PaymentStatus.WAIVED);
            } else {
                rec.setStatus(FeeRecord.PaymentStatus.PAID);
            }
        }
        feeRepository.save(rec);

        return toConcessionDTO(sc);
    }

    @Override
    public List<AppDTO.ScholarshipConcessionDTO> getStudentConcessions(Long studentId) {
        return scholarshipConcessionRepository.findByStudentId(studentId).stream()
                .map(this::toConcessionDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.ScholarshipConcessionDTO> getAllConcessions() {
        return scholarshipConcessionRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .map(this::toConcessionDTO)
                .collect(Collectors.toList());
    }

    private AppDTO.ScholarshipConcessionDTO toConcessionDTO(ScholarshipConcession sc) {
        return AppDTO.ScholarshipConcessionDTO.builder()
                .id(sc.getId())
                .studentId(sc.getStudent() != null ? sc.getStudent().getId() : null)
                .studentName(sc.getStudent() != null ? sc.getStudent().getName() : "Unknown")
                .rollNumber(sc.getStudent() != null ? sc.getStudent().getRollNumber() : "—")
                .feeStructureId(sc.getFeeStructure() != null ? sc.getFeeStructure().getId() : null)
                .feeStructureName(sc.getFeeStructure() != null ? sc.getFeeStructure().getName() : "—")
                .concessionType(sc.getConcessionType())
                .discountPercentage(sc.getDiscountPercentage())
                .amount(sc.getAmount())
                .reason(sc.getReason())
                .status(sc.getStatus())
                .approvedByName(sc.getApprovedBy() != null ? sc.getApprovedBy().getName() : "Authorized Officer")
                .supportingDocumentUrl(sc.getSupportingDocumentUrl())
                .createdAt(sc.getCreatedAt())
                .build();
    }

    // ================= Payment Gateway (Razorpay) =================

    @Override
    @Transactional
    public AppDTO.CreateOrderResponse createPaymentOrder(AppDTO.CreateOrderRequest req, Long studentId) {
        FeeRecord rec = feeRepository.findById(req.getFeeRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Fee record not found with ID: " + req.getFeeRecordId()));

        if (!rec.getStudent().getId().equals(studentId)) {
            throw new BadRequestException("Unauthorized attempt to create payment order for another student's fee record");
        }

        BigDecimal paid = rec.getAmountPaid() != null ? rec.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal concession = rec.getConcession() != null ? rec.getConcession() : BigDecimal.ZERO;
        BigDecimal balance = rec.getAmountDue().subtract(paid).subtract(concession);

        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("This fee record has already been settled in full. No remaining balance due.");
        }

        if (req.getAmount().compareTo(balance) > 0) {
            throw new BadRequestException("Requested amount (₹" + req.getAmount() + ") exceeds remaining balance (₹" + balance + ")");
        }

        String orderId = "AU_ORD_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 9000 + 1000);
        String gatewayOrderId = "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);

        PaymentOrder po = PaymentOrder.builder()
                .orderId(orderId)
                .student(rec.getStudent())
                .feeStructure(rec.getFeeStructure())
                .amount(req.getAmount())
                .currency("INR")
                .gatewayProvider("RAZORPAY_SANDBOX")
                .gatewayOrderId(gatewayOrderId)
                .paymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : "ONLINE_CHECKOUT")
                .status("CREATED")
                .build();
        paymentOrderRepository.save(po);

        return AppDTO.CreateOrderResponse.builder()
                .orderId(orderId)
                .gatewayOrderId(gatewayOrderId)
                .amount(req.getAmount())
                .currency("INR")
                .keyId("rzp_test_aditya_sis_sandbox")
                .studentName(rec.getStudent().getName())
                .studentEmail(rec.getStudent().getEmail())
                .studentContact(rec.getStudent().getMobileNumber() != null ? rec.getStudent().getMobileNumber() : "9876543210")
                .feeStructureName(rec.getFeeStructure().getName())
                .receiptNumber(rec.getReceiptNumber())
                .build();
    }

    @Override
    @Transactional
    public AppDTO.FeeRecordDTO verifyPayment(AppDTO.VerifyPaymentRequest req, Long studentId) {
        PaymentOrder po = paymentOrderRepository.findByOrderId(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment order not found with ID: " + req.getOrderId()));

        if (!po.getStudent().getId().equals(studentId)) {
            throw new BadRequestException("Unauthorized access: payment order does not belong to the authenticated student");
        }

        if ("SUCCESS".equalsIgnoreCase(po.getStatus())) {
            // Already verified and processed
            FeeRecord rec = feeRepository.findByStudentIdAndFeeStructureId(po.getStudent().getId(), po.getFeeStructure().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Fee record not found"));
            return AppDTO.FeeRecordDTO.from(rec);
        }

        po.setStatus("SUCCESS");
        po.setGatewayPaymentId(req.getGatewayPaymentId());
        po.setGatewaySignature(req.getGatewaySignature());
        po.setCompletedAt(LocalDateTime.now());

        FeeRecord rec = feeRepository.findByStudentIdAndFeeStructureId(po.getStudent().getId(), po.getFeeStructure().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Fee record not found for student " + studentId));

        BigDecimal newPaid = (rec.getAmountPaid() != null ? rec.getAmountPaid() : BigDecimal.ZERO).add(po.getAmount());
        rec.setAmountPaid(newPaid);
        rec.setPaymentMode("ONLINE_RAZORPAY");
        rec.setTransactionReference(req.getGatewayPaymentId());
        rec.setPaymentDate(LocalDate.now());

        if (rec.getReceiptNumber() == null) {
            rec.setReceiptNumber(generateReceiptNumber());
        }

        BigDecimal concession = rec.getConcession() != null ? rec.getConcession() : BigDecimal.ZERO;
        BigDecimal balance = rec.getAmountDue().subtract(newPaid).subtract(concession);
        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            rec.setStatus(FeeRecord.PaymentStatus.PAID);
        } else {
            rec.setStatus(FeeRecord.PaymentStatus.PARTIAL);
        }

        rec = feeRepository.save(rec);
        po.setReceiptNumber(rec.getReceiptNumber());
        paymentOrderRepository.save(po);

        // Generate in-app student notification
        try {
            Notification notif = Notification.builder()
                    .recipient(rec.getStudent())
                    .title("Fee Payment Received")
                    .message("Your fee payment of ₹" + po.getAmount() + " for " + rec.getFeeStructure().getName() + " was successfully credited. Official Receipt: " + rec.getReceiptNumber())
                    .type("GENERAL")
                    .link("/student/fees")
                    .build();
            notificationRepository.save(notif);
        } catch (Exception ex) {
            log.warn("Could not dispatch fee notification: {}", ex.getMessage());
        }

        return AppDTO.FeeRecordDTO.from(rec);
    }

    // ================= Offline Payments =================

    @Override
    @Transactional
    public AppDTO.OfflinePaymentSubmissionDTO submitOfflinePayment(AppDTO.SubmitOfflinePaymentRequest req, Long studentId) {
        FeeRecord rec = feeRepository.findById(req.getFeeRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Fee record not found with ID: " + req.getFeeRecordId()));

        if (!rec.getStudent().getId().equals(studentId)) {
            throw new BadRequestException("You can only submit payment proofs for your own fee dues");
        }

        OfflinePaymentSubmission sub = OfflinePaymentSubmission.builder()
                .student(rec.getStudent())
                .feeStructure(rec.getFeeStructure())
                .amount(req.getAmount())
                .paymentMode(req.getPaymentMode())
                .transactionReference(req.getTransactionReference().trim())
                .bankName(req.getBankName())
                .paymentDate(req.getPaymentDate())
                .proofDocumentUrl(req.getProofDocumentUrl())
                .remarks(req.getRemarks())
                .status("PENDING")
                .build();

        return toOfflineDTO(offlinePaymentSubmissionRepository.save(sub));
    }

    @Override
    public List<AppDTO.OfflinePaymentSubmissionDTO> getStudentOfflineSubmissions(Long studentId) {
        return offlinePaymentSubmissionRepository.findByStudentIdOrderByCreatedAtDesc(studentId).stream()
                .map(this::toOfflineDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.OfflinePaymentSubmissionDTO> getAllPendingOfflineSubmissions() {
        return offlinePaymentSubmissionRepository.findByStatusOrderByCreatedAtDesc("PENDING").stream()
                .map(this::toOfflineDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppDTO.FeeRecordDTO reviewOfflineSubmission(Long submissionId, AppDTO.ReviewOfflinePaymentRequest req, Long reviewerUserId) {
        OfflinePaymentSubmission sub = offlinePaymentSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Offline submission not found with ID: " + submissionId));

        User reviewer = reviewerUserId != null ? userRepository.findById(reviewerUserId).orElse(null) : null;

        FeeRecord rec = feeRepository.findByStudentIdAndFeeStructureId(sub.getStudent().getId(), sub.getFeeStructure().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Fee record not found for student " + sub.getStudent().getId()));

        if (Boolean.TRUE.equals(req.getApprove())) {
            sub.setStatus("VERIFIED");
            sub.setVerifiedBy(reviewer);
            sub.setVerifiedAt(LocalDateTime.now());

            BigDecimal newPaid = (rec.getAmountPaid() != null ? rec.getAmountPaid() : BigDecimal.ZERO).add(sub.getAmount());
            rec.setAmountPaid(newPaid);
            rec.setPaymentMode(sub.getPaymentMode());
            rec.setTransactionReference(sub.getTransactionReference());
            rec.setPaymentDate(sub.getPaymentDate());
            if (reviewer != null) rec.setCollectedBy(reviewer);

            if (rec.getReceiptNumber() == null) {
                rec.setReceiptNumber(generateReceiptNumber());
            }

            BigDecimal concession = rec.getConcession() != null ? rec.getConcession() : BigDecimal.ZERO;
            BigDecimal balance = rec.getAmountDue().subtract(newPaid).subtract(concession);
            if (balance.compareTo(BigDecimal.ZERO) <= 0) {
                rec.setStatus(FeeRecord.PaymentStatus.PAID);
            } else {
                rec.setStatus(FeeRecord.PaymentStatus.PARTIAL);
            }

            rec = feeRepository.save(rec);

            // Notify student
            try {
                notificationRepository.save(Notification.builder()
                        .recipient(sub.getStudent())
                        .title("Offline Payment Verified")
                        .message("Your offline payment (" + sub.getPaymentMode() + " - UTR: " + sub.getTransactionReference() + ") of ₹" + sub.getAmount() + " was verified. Official Receipt: " + rec.getReceiptNumber())
                        .type("GENERAL")
                        .link("/student/fees")
                        .build());
            } catch (Exception ignored) {}

        } else {
            sub.setStatus("REJECTED");
            sub.setRejectionReason(req.getRemarks() != null ? req.getRemarks() : "Payment voucher / UTR could not be verified with university accounts.");
            sub.setVerifiedBy(reviewer);
            sub.setVerifiedAt(LocalDateTime.now());

            // Notify student
            try {
                notificationRepository.save(Notification.builder()
                        .recipient(sub.getStudent())
                        .title("Offline Payment Verification Failed")
                        .message("Your offline payment submission (Ref: " + sub.getTransactionReference() + ") was rejected: " + sub.getRejectionReason())
                        .type("GENERAL")
                        .link("/student/fees")
                        .build());
            } catch (Exception ignored) {}
        }

        offlinePaymentSubmissionRepository.save(sub);
        return AppDTO.FeeRecordDTO.from(rec);
    }

    private AppDTO.OfflinePaymentSubmissionDTO toOfflineDTO(OfflinePaymentSubmission s) {
        return AppDTO.OfflinePaymentSubmissionDTO.builder()
                .id(s.getId())
                .studentId(s.getStudent() != null ? s.getStudent().getId() : null)
                .studentName(s.getStudent() != null ? s.getStudent().getName() : "Unknown")
                .rollNumber(s.getStudent() != null ? s.getStudent().getRollNumber() : "—")
                .feeStructureId(s.getFeeStructure() != null ? s.getFeeStructure().getId() : null)
                .feeStructureName(s.getFeeStructure() != null ? s.getFeeStructure().getName() : "—")
                .amount(s.getAmount())
                .paymentMode(s.getPaymentMode())
                .transactionReference(s.getTransactionReference())
                .bankName(s.getBankName())
                .paymentDate(s.getPaymentDate())
                .proofDocumentUrl(s.getProofDocumentUrl())
                .remarks(s.getRemarks())
                .status(s.getStatus())
                .verifiedByName(s.getVerifiedBy() != null ? s.getVerifiedBy().getName() : null)
                .verifiedAt(s.getVerifiedAt())
                .rejectionReason(s.getRejectionReason())
                .createdAt(s.getCreatedAt())
                .build();
    }

    // ================= Admin Oversight & Reporting =================

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
                .sorted((a, b) -> Long.compare(b.getId() != null ? b.getId() : 0L, a.getId() != null ? a.getId() : 0L))
                .limit(6)
                .map(AppDTO.FeeStructureDTO::from)
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
    public AppDTO.PagedResult<AppDTO.FeeRecordDTO> getAdminFeeRecords(String search, String category, String status, String department, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        FeeStructure.FeeCategory catEnum = null;
        if (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category)) {
            try {
                catEnum = FeeStructure.FeeCategory.valueOf(category.toUpperCase());
            } catch (Exception ignored) {}
        }

        FeeRecord.PaymentStatus statusEnum = null;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            try {
                statusEnum = FeeRecord.PaymentStatus.valueOf(status.toUpperCase());
            } catch (Exception ignored) {}
        }

        String dept = (department != null && !department.isBlank() && !"ALL".equalsIgnoreCase(department)) ? department.trim() : null;

        Page<FeeRecord> feePage = feeRepository.findAdminFeeRecords(cleanSearch, catEnum, statusEnum, dept, pageable);

        return AppDTO.PagedResult.<AppDTO.FeeRecordDTO>builder()
                .content(feePage.getContent().stream().map(AppDTO.FeeRecordDTO::from).collect(Collectors.toList()))
                .page(feePage.getNumber())
                .size(feePage.getSize())
                .totalElements(feePage.getTotalElements())
                .totalPages(feePage.getTotalPages())
                .last(feePage.isLast())
                .build();
    }

    // ================= Faculty Clearance =================

    @Override
    public AppDTO.FeeClearanceSummaryDTO getFacultyDepartmentClearance(String department, Integer semester) {
        String dept = (department != null && !department.isBlank() && !"ALL".equalsIgnoreCase(department)) ? department.trim() : null;
        Integer sem = semester != null && semester > 0 ? semester : null;

        List<User> students = userRepository.findStudentsForBulkAssignment(dept, sem, null);
        long totalStudents = students.size();
        long clearedCount = 0;
        long pendingCount = 0;
        long overdueCount = 0;

        for (User s : students) {
            List<FeeRecord> records = feeRepository.findByStudentId(s.getId());
            boolean allCleared = true;
            boolean hasOverdue = false;

            if (records.isEmpty()) {
                allCleared = false;
            } else {
                for (FeeRecord r : records) {
                    if (r.getStatus() == FeeRecord.PaymentStatus.OVERDUE) {
                        hasOverdue = true;
                        allCleared = false;
                    } else if (r.getStatus() != FeeRecord.PaymentStatus.PAID && r.getStatus() != FeeRecord.PaymentStatus.WAIVED) {
                        allCleared = false;
                    }
                }
            }

            if (allCleared) {
                clearedCount++;
            } else if (hasOverdue) {
                overdueCount++;
                pendingCount++;
            } else {
                pendingCount++;
            }
        }

        double pct = totalStudents > 0 ? (clearedCount * 100.0) / totalStudents : 100.0;

        return AppDTO.FeeClearanceSummaryDTO.builder()
                .department(department)
                .semester(semester)
                .totalStudents(totalStudents)
                .clearedCount(clearedCount)
                .pendingCount(pendingCount)
                .overdueCount(overdueCount)
                .clearancePercentage(Math.round(pct * 10.0) / 10.0)
                .build();
    }

    @Override
    public AppDTO.PagedResult<AppDTO.FeeRecordDTO> getFacultyClearanceRecords(String department, Integer semester, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "student.name"));

        String dept = (department != null && !department.isBlank() && !"ALL".equalsIgnoreCase(department)) ? department.trim() : null;
        Integer sem = semester != null && semester > 0 ? semester : null;

        FeeRecord.PaymentStatus statusEnum = null;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            try {
                statusEnum = FeeRecord.PaymentStatus.valueOf(status.toUpperCase());
            } catch (Exception ignored) {}
        }

        Page<FeeRecord> pageData = feeRepository.findClearanceRecords(dept, sem, statusEnum, pageable);

        return AppDTO.PagedResult.<AppDTO.FeeRecordDTO>builder()
                .content(pageData.getContent().stream().map(AppDTO.FeeRecordDTO::from).collect(Collectors.toList()))
                .page(pageData.getNumber())
                .size(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .last(pageData.isLast())
                .build();
    }

    // ================= Helpers & Seeding =================

    private String generateReceiptNumber() {
        return "AU-FEE-" + LocalDate.now().getYear() + "-" + String.format("%05d", (int) (Math.random() * 90000 + 10000));
    }

    private FeeStructure.FeeCategory resolveCategoryEnum(String catStr) {
        if (catStr == null || catStr.isBlank()) return FeeStructure.FeeCategory.TUITION;
        try {
            return FeeStructure.FeeCategory.valueOf(catStr.toUpperCase());
        } catch (Exception e) {
            return FeeStructure.FeeCategory.MISCELLANEOUS;
        }
    }

    private void seedDefaultCategoriesIfEmpty() {
        if (feeCategoryRepository.count() > 0) return;

        List<FeeCategory> defaults = List.of(
                FeeCategory.builder().code("TUITION").name("Academic Tuition & Lab Fee").description("Regular semester academic tuition and state-of-the-art laboratory access fees.").isActive(true).build(),
                FeeCategory.builder().code("TRANSPORT").name("University Transit & Bus Pass").description("Air-conditioned university transit service covering central city corridors to campus.").isActive(true).build(),
                FeeCategory.builder().code("HOSTEL").name("Hostel Accommodation & Dining").description("Campus residential block accommodation and hygienic dietary dining facilities.").isActive(true).build(),
                FeeCategory.builder().code("EXAM").name("Semester Examination & Evaluation").description("Examination hall ticket, theory evaluation, and practical laboratory assessment fee.").isActive(true).build(),
                FeeCategory.builder().code("LIBRARY").name("Digital Library & Learning Resources").description("IEEE/ACM database subscriptions, e-library portal, and physical book access.").isActive(true).build(),
                FeeCategory.builder().code("LAB").name("Specialized Advanced Laboratory").description("Advanced AI computing cluster, robotics fabrication, and cleanroom lab fees.").isActive(true).build(),
                FeeCategory.builder().code("ADMISSION").name("Institutional Admission & Enrolment").description("One-time institutional admission processing and identity matriculation.").isActive(true).build(),
                FeeCategory.builder().code("REGISTRATION").name("Academic Semester Registration").description("Semester-wise academic registration, LMS portal access, and batch allocation.").isActive(true).build(),
                FeeCategory.builder().code("CAUTION_DEPOSIT").name("Refundable Caution Deposit").description("One-time refundable institutional and laboratory equipment caution deposit.").isActive(true).build(),
                FeeCategory.builder().code("ACTIVITY").name("Sports, Cultural & Co-Curricular").description("Annual cultural fests, national hackathons, collegiate sports, and clubs.").isActive(true).build(),
                FeeCategory.builder().code("MISC").name("Miscellaneous Institutional Charges").description("Smart ID card issuance, university journal subscription, and incidental charges.").isActive(true).build()
        );

        feeCategoryRepository.saveAll(defaults);
        log.info("Successfully seeded 11 default institutional fee categories");
    }

    @Override
    @Transactional
    public synchronized void seedDefaultFeesIfEmpty() {
        seedDefaultCategoriesIfEmpty();

        if (feeStructureRepository.count() > 0) return;

        List<FeeStructure> defaults = List.of(
                FeeStructure.builder()
                        .name("B.Tech Autonomous Academic Tuition Fee – Odd Sem")
                        .category(FeeStructure.FeeCategory.TUITION)
                        .categoryCode("TUITION")
                        .academicYear("2026-27")
                        .amount(new BigDecimal("65000.00"))
                        .dueDate(LocalDate.of(2026, 11, 30))
                        .description("Regular semester academic tuition and state-of-the-art laboratory access fees.")
                        .status(FeeStructure.Status.ACTIVE)
                        .build(),
                FeeStructure.builder()
                        .name("Semester End Examination (SEE) & Evaluation Fee")
                        .category(FeeStructure.FeeCategory.EXAM)
                        .categoryCode("EXAM")
                        .academicYear("2026-27")
                        .amount(new BigDecimal("2500.00"))
                        .dueDate(LocalDate.of(2026, 11, 25))
                        .description("Examination hall ticket, theory evaluation, and practical laboratory assessment fee.")
                        .status(FeeStructure.Status.ACTIVE)
                        .build(),
                FeeStructure.builder()
                        .name("University Transit Bus Pass – Route 14 (Campus Express)")
                        .category(FeeStructure.FeeCategory.TRANSPORT)
                        .categoryCode("TRANSPORT")
                        .academicYear("2026-27")
                        .amount(new BigDecimal("18000.00"))
                        .dueDate(LocalDate.of(2026, 11, 20))
                        .description("Air-conditioned university transit service covering central city corridors to campus.")
                        .status(FeeStructure.Status.ACTIVE)
                        .build(),
                FeeStructure.builder()
                        .name("Hostel Accommodation & Campus Mess Fee")
                        .category(FeeStructure.FeeCategory.HOSTEL)
                        .categoryCode("HOSTEL")
                        .academicYear("2026-27")
                        .amount(new BigDecimal("35000.00"))
                        .dueDate(LocalDate.of(2026, 12, 5))
                        .description("Campus residential block accommodation and hygienic dietary dining facilities.")
                        .status(FeeStructure.Status.ACTIVE)
                        .build()
        );

        feeStructureRepository.saveAll(defaults);
        log.info("Successfully seeded default institutional fee structures");
    }
}
