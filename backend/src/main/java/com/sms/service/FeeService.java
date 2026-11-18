package com.sms.service;

import com.sms.dto.AppDTO;

import java.util.List;

public interface FeeService {

    // ================= Category Management =================
    List<AppDTO.FeeCategoryDTO> getAllCategories();
    AppDTO.FeeCategoryDTO createCategory(AppDTO.FeeCategoryDTO dto);
    AppDTO.FeeCategoryDTO toggleCategory(Long id);

    // ================= Structure Management =================
    List<AppDTO.FeeStructureDTO> getAllStructures();
    AppDTO.FeeStructureDTO createStructure(AppDTO.FeeStructureDTO dto);
    AppDTO.FeeStructureDTO updateStructure(Long id, AppDTO.FeeStructureDTO dto);
    void deleteStructure(Long id);
    AppDTO.BulkFeeAssignResult bulkAssignFee(AppDTO.BulkFeeAssignRequest req);

    // ================= Student Fee Records =================
    List<AppDTO.FeeRecordDTO> getStudentFeeRecords(Long studentId);
    AppDTO.FeeRecordDTO payFee(AppDTO.FeePaymentRequest req, Long collectedByUserId);
    AppDTO.FeeRecordDTO getReceiptByNumber(String receiptNumber);
    byte[] generateFeeReceiptPdfBytes(String receiptNumber);

    // ================= Scholarships & Concessions =================
    AppDTO.ScholarshipConcessionDTO addConcession(AppDTO.AddConcessionRequest req, Long approvedByUserId);
    List<AppDTO.ScholarshipConcessionDTO> getStudentConcessions(Long studentId);
    List<AppDTO.ScholarshipConcessionDTO> getAllConcessions();

    // ================= Payment Gateway (Razorpay) =================
    AppDTO.CreateOrderResponse createPaymentOrder(AppDTO.CreateOrderRequest req, Long studentId);
    AppDTO.FeeRecordDTO verifyPayment(AppDTO.VerifyPaymentRequest req, Long studentId);

    // ================= Offline Payments =================
    AppDTO.OfflinePaymentSubmissionDTO submitOfflinePayment(AppDTO.SubmitOfflinePaymentRequest req, Long studentId);
    List<AppDTO.OfflinePaymentSubmissionDTO> getStudentOfflineSubmissions(Long studentId);
    List<AppDTO.OfflinePaymentSubmissionDTO> getAllPendingOfflineSubmissions();
    AppDTO.FeeRecordDTO reviewOfflineSubmission(Long submissionId, AppDTO.ReviewOfflinePaymentRequest req, Long reviewerUserId);

    // ================= Admin Oversight & Reporting =================
    AppDTO.FeeOverviewDTO getOverview();
    AppDTO.PagedResult<AppDTO.FeeRecordDTO> getAdminFeeRecords(String search, String category, String status, String department, int page, int size);

    // ================= Faculty Clearance =================
    AppDTO.FeeClearanceSummaryDTO getFacultyDepartmentClearance(String department, Integer semester);
    AppDTO.PagedResult<AppDTO.FeeRecordDTO> getFacultyClearanceRecords(String department, Integer semester, String status, int page, int size);

    void seedDefaultFeesIfEmpty();
}
