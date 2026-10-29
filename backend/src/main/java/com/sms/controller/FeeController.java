package com.sms.controller;

import com.sms.dto.AppDTO;
import com.sms.entity.User;
import com.sms.repository.UserRepository;
import com.sms.service.FeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/structures")
    public ResponseEntity<List<AppDTO.FeeStructureDTO>> getAllStructures() {
        return ResponseEntity.ok(feeService.getAllStructures());
    }

    @PostMapping("/structures")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppDTO.FeeStructureDTO> createStructure(@Valid @RequestBody AppDTO.FeeStructureDTO dto) {
        return ResponseEntity.ok(feeService.createStructure(dto));
    }

    @GetMapping("/my-records")
    public ResponseEntity<List<AppDTO.FeeRecordDTO>> getMyFeeRecords(@AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        if (u == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(feeService.getStudentFeeRecords(u.getId()));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AppDTO.FeeRecordDTO>> getStudentRecords(@PathVariable Long studentId) {
        return ResponseEntity.ok(feeService.getStudentFeeRecords(studentId));
    }

    @PostMapping("/pay")
    public ResponseEntity<AppDTO.FeeRecordDTO> payFee(@Valid @RequestBody AppDTO.FeePaymentRequest req,
                                                      @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        // If student is paying, ensure studentId matches
        if (u != null && u.getRole() == User.Role.STUDENT) {
            req.setStudentId(u.getId());
        }
        return ResponseEntity.ok(feeService.payFee(req, u != null ? u.getId() : null));
    }

    @GetMapping("/receipt/{receiptNumber}")
    public ResponseEntity<AppDTO.FeeRecordDTO> getReceipt(@PathVariable String receiptNumber) {
        return ResponseEntity.ok(feeService.getReceiptByNumber(receiptNumber));
    }

    @GetMapping("/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppDTO.FeeOverviewDTO> getOverview() {
        return ResponseEntity.ok(feeService.getOverview());
    }
}

