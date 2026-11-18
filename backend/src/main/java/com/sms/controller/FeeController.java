package com.sms.controller;

import com.sms.dto.AppDTO;
import com.sms.entity.User;
import com.sms.exception.BadRequestException;
import com.sms.repository.UserRepository;
import com.sms.service.FeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fees")
@RequiredArgsConstructor
public class FeeController {

    private final FeeService feeService;
    private final UserRepository userRepository;

    private User getUser(UserDetails ud) {
        if (ud == null) return null;
        return userRepository.findByEmail(ud.getUsername()).orElse(null);
    }

    // ================= Category Management =================

    @GetMapping("/categories")
    public ResponseEntity<List<AppDTO.FeeCategoryDTO>> getAllCategories() {
        return ResponseEntity.ok(feeService.getAllCategories());
    }

    @PostMapping("/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppDTO.FeeCategoryDTO> createCategory(@Valid @RequestBody AppDTO.FeeCategoryDTO dto) {
        return ResponseEntity.ok(feeService.createCategory(dto));
    }

    @PatchMapping("/categories/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppDTO.FeeCategoryDTO> toggleCategory(@PathVariable Long id) {
        return ResponseEntity.ok(feeService.toggleCategory(id));
    }

    // ================= Structure Management =================

    @GetMapping("/structures")
    public ResponseEntity<List<AppDTO.FeeStructureDTO>> getAllStructures() {
        return ResponseEntity.ok(feeService.getAllStructures());
    }

    @PostMapping("/structures")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppDTO.FeeStructureDTO> createStructure(@Valid @RequestBody AppDTO.FeeStructureDTO dto) {
        return ResponseEntity.ok(feeService.createStructure(dto));
    }

    @PutMapping("/structures/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppDTO.FeeStructureDTO> updateStructure(@PathVariable Long id,
                                                                 @RequestBody AppDTO.FeeStructureDTO dto) {
        return ResponseEntity.ok(feeService.updateStructure(id, dto));
    }

    @DeleteMapping("/structures/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteStructure(@PathVariable Long id) {
        feeService.deleteStructure(id);
        return ResponseEntity.ok(Map.of("message", "Fee structure removed or deactivated successfully"));
    }

    @PostMapping("/structures/bulk-assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppDTO.BulkFeeAssignResult> bulkAssignFee(@Valid @RequestBody AppDTO.BulkFeeAssignRequest req) {
        return ResponseEntity.ok(feeService.bulkAssignFee(req));
    }

    // ================= Student Fee Records =================

    @GetMapping("/my-records")
    public ResponseEntity<List<AppDTO.FeeRecordDTO>> getMyFeeRecords(@AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        if (u == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(feeService.getStudentFeeRecords(u.getId()));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AppDTO.FeeRecordDTO>> getStudentRecords(@PathVariable Long studentId,
                                                                       @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        if (u == null) return ResponseEntity.status(401).build();
        if (u.getRole() == User.Role.STUDENT && !u.getId().equals(studentId)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(feeService.getStudentFeeRecords(studentId));
    }

    @PostMapping("/pay")
    public ResponseEntity<AppDTO.FeeRecordDTO> payFee(@Valid @RequestBody AppDTO.FeePaymentRequest req,
                                                      @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        if (u != null && u.getRole() == User.Role.STUDENT) {
            req.setStudentId(u.getId());
        }
        return ResponseEntity.ok(feeService.payFee(req, u != null ? u.getId() : null));
    }

    // ================= Receipt & Public Verification =================

    @GetMapping("/receipt/{receiptNumber}")
    public ResponseEntity<AppDTO.FeeRecordDTO> getReceipt(@PathVariable String receiptNumber,
                                                          @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        if (u == null) return ResponseEntity.status(401).build();
        AppDTO.FeeRecordDTO receipt = feeService.getReceiptByNumber(receiptNumber);
        if (u.getRole() == User.Role.STUDENT && !u.getId().equals(receipt.getStudentId())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(receipt);
    }

    @GetMapping("/receipt/{receiptNumber}/pdf")
    public ResponseEntity<byte[]> downloadReceiptPdf(@PathVariable String receiptNumber) {
        byte[] pdf = feeService.generateFeeReceiptPdfBytes(receiptNumber);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"Fee_Receipt_" + receiptNumber + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping({"/verify/{receiptNumber}", "/verify"})
    public ResponseEntity<Map<String, Object>> verifyReceipt(
            @PathVariable(required = false) String receiptNumber,
            @RequestParam(required = false) String number,
            @RequestParam(required = false) String id,
            @RequestParam(required = false) String receipt,
            @RequestParam(required = false) String url,
            @RequestParam(required = false) Map<String, String> allParams) {
        String direct = receiptNumber;
        if (direct == null || direct.isBlank()) {
            if (number != null && !number.isBlank()) direct = number;
            else if (id != null && !id.isBlank()) direct = id;
            else if (receipt != null && !receipt.isBlank()) direct = receipt;
            else if (url != null && !url.isBlank()) direct = url;
        }

        String target = com.sms.util.UrlRequestParamResolver.resolveFeeReceiptNumber(direct, allParams);

        AppDTO.FeeRecordDTO rec = feeService.getReceiptByNumber(target != null ? target.trim() : "");
        Map<String, Object> resp = new HashMap<>();
        resp.put("valid", true);
        resp.put("receiptNumber", rec.getReceiptNumber());
        resp.put("studentName", rec.getStudentName());
        resp.put("rollNumber", rec.getRollNumber());
        resp.put("department", rec.getDepartment());
        resp.put("feeName", rec.getFeeStructureName());
        resp.put("amountPaid", rec.getAmountPaid());
        resp.put("status", rec.getStatus());
        resp.put("paymentMode", rec.getPaymentMode());
        resp.put("transactionReference", rec.getTransactionReference());
        resp.put("paymentDate", rec.getPaymentDate());
        resp.put("institution", "Aditya University – Autonomous Financial Registry");
        resp.put("resolvedIdentifier", target);
        return ResponseEntity.ok(resp);
    }

    // ================= Scholarships & Concessions =================

    @PostMapping("/concessions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppDTO.ScholarshipConcessionDTO> addConcession(@Valid @RequestBody AppDTO.AddConcessionRequest req,
                                                                        @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        return ResponseEntity.ok(feeService.addConcession(req, u != null ? u.getId() : null));
    }

    @GetMapping("/concessions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AppDTO.ScholarshipConcessionDTO>> getAllConcessions() {
        return ResponseEntity.ok(feeService.getAllConcessions());
    }

    @GetMapping("/concessions/student/{studentId}")
    public ResponseEntity<List<AppDTO.ScholarshipConcessionDTO>> getStudentConcessions(@PathVariable Long studentId,
                                                                                       @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        if (u == null) return ResponseEntity.status(401).build();
        if (u.getRole() == User.Role.STUDENT && !u.getId().equals(studentId)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(feeService.getStudentConcessions(studentId));
    }

    // ================= Payment Gateway (Razorpay) =================

    @PostMapping("/payments/order")
    public ResponseEntity<AppDTO.CreateOrderResponse> createPaymentOrder(@Valid @RequestBody AppDTO.CreateOrderRequest req,
                                                                         @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        if (u == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(feeService.createPaymentOrder(req, u.getId()));
    }

    @PostMapping("/payments/verify")
    public ResponseEntity<AppDTO.FeeRecordDTO> verifyPayment(@Valid @RequestBody AppDTO.VerifyPaymentRequest req,
                                                             @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        if (u == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(feeService.verifyPayment(req, u.getId()));
    }

    // ================= Offline Payments =================

    @PostMapping("/offline/submit")
    public ResponseEntity<AppDTO.OfflinePaymentSubmissionDTO> submitOfflinePayment(@Valid @RequestBody AppDTO.SubmitOfflinePaymentRequest req,
                                                                                   @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        if (u == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(feeService.submitOfflinePayment(req, u.getId()));
    }

    @GetMapping("/offline/my-submissions")
    public ResponseEntity<List<AppDTO.OfflinePaymentSubmissionDTO>> getMyOfflineSubmissions(@AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        if (u == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(feeService.getStudentOfflineSubmissions(u.getId()));
    }

    @GetMapping("/offline/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AppDTO.OfflinePaymentSubmissionDTO>> getPendingOfflineSubmissions() {
        return ResponseEntity.ok(feeService.getAllPendingOfflineSubmissions());
    }

    @PostMapping("/offline/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppDTO.FeeRecordDTO> reviewOfflineSubmission(@PathVariable Long id,
                                                                       @Valid @RequestBody AppDTO.ReviewOfflinePaymentRequest req,
                                                                       @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        return ResponseEntity.ok(feeService.reviewOfflineSubmission(id, req, u != null ? u.getId() : null));
    }

    // ================= Admin Oversight & Reporting =================

    @GetMapping("/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppDTO.FeeOverviewDTO> getOverview() {
        return ResponseEntity.ok(feeService.getOverview());
    }

    @GetMapping("/admin/records")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppDTO.PagedResult<AppDTO.FeeRecordDTO>> getAdminFeeRecords(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(feeService.getAdminFeeRecords(search, category, status, department, page, size));
    }

    // ================= Faculty Clearance =================

    @GetMapping("/faculty/clearance/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ResponseEntity<AppDTO.FeeClearanceSummaryDTO> getFacultyClearanceSummary(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer semester,
            @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        String dept = (department != null && !department.isBlank()) ? department : (u != null ? u.getDepartment() : null);
        return ResponseEntity.ok(feeService.getFacultyDepartmentClearance(dept, semester));
    }

    @GetMapping("/faculty/clearance/records")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ResponseEntity<AppDTO.PagedResult<AppDTO.FeeRecordDTO>> getFacultyClearanceRecords(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        String dept = (department != null && !department.isBlank()) ? department : (u != null ? u.getDepartment() : null);
        return ResponseEntity.ok(feeService.getFacultyClearanceRecords(dept, semester, status, page, size));
    }
}
