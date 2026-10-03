package com.sms.service;

import com.sms.dto.AppDTO;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface AttendanceService {
    // Session & Online Code Check-in
    AppDTO.AttendanceSessionDTO startAttendanceSession(Long facultyId, Long courseId, String section, String sessionType);
    AppDTO.AttendanceResponse checkInWithCode(Long studentId, AppDTO.CheckInRequest request);
    void closeAttendanceSession(Long sessionId);
    AppDTO.AttendanceSessionDTO getSessionStatus(Long sessionId);

    // Manual Attendance
    List<AppDTO.AttendanceResponse> markManualBatch(Long facultyId, Long courseId, LocalDate date, List<AppDTO.AttendanceRequest> records);
    List<AppDTO.AttendanceResponse> getCourseAttendance(Long courseId, LocalDate date);
    List<AppDTO.AttendanceResponse> getStudentAttendanceHistory(Long studentId);
    Map<String, Object> getStudentAttendanceSummary(Long studentId);
    Map<String, Object> getInstitutionAttendanceSummary();

    // Correction Requests
    AppDTO.AttendanceCorrectionDTO submitCorrectionRequest(Long studentId, AppDTO.AttendanceCorrectionDTO request);
    List<AppDTO.AttendanceCorrectionDTO> getPendingCorrections();
    List<AppDTO.AttendanceCorrectionDTO> getStudentCorrections(Long studentId);
    AppDTO.AttendanceCorrectionDTO reviewCorrection(Long correctionId, Long facultyId, boolean approve, String remarks);
}
