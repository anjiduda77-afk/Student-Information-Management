package com.sms.service;

import com.sms.dto.AppDTO;

import java.util.List;

public interface FeeService {

    List<AppDTO.FeeStructureDTO> getAllStructures();

    AppDTO.FeeStructureDTO createStructure(AppDTO.FeeStructureDTO dto);

    List<AppDTO.FeeRecordDTO> getStudentFeeRecords(Long studentId);

    AppDTO.FeeRecordDTO payFee(AppDTO.FeePaymentRequest req, Long collectedByUserId);

    AppDTO.FeeRecordDTO getReceiptByNumber(String receiptNumber);

    AppDTO.FeeOverviewDTO getOverview();

    void seedDefaultFeesIfEmpty();
}

