package com.sms.service;

import com.sms.dto.AppDTO;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface AttendanceService {
    // Timetable & Today's Classes Integration
    List<AppDTO.FacultyTodayClassDTO> getFacultyTodayClasses(Long facultyId, LocalDate date);
    AppDTO.AttendanceSessionDTO startSessionFromTimetable(Long facultyId, Long timetableId, String sessionType);
    List<AppDTO.UserResponse> getSessionStudents(Long sessionId);

    // Session & Online Code Check-in
    AppDTO.AttendanceSessionDTO startAttendanceSession(Long facultyId, Long courseId, String section, String sessionType);
    AppDTO.AttendanceResponse checkInWithCode(Long studentId, AppDTO.CheckInRequest request);
    void closeAttendanceSession(Long sessionId);
    AppDTO.AttendanceSessionDTO getSessionStatus(Long sessionId);

    // Manual Attendance
    List<AppDTO.DepartmentDTO> getFacultyAuthorizedDepartments(Long facultyId);
    List<String> getFacultyDepartmentSections(Long facultyId, String department);
    AppDTO.ManualAttendanceRosterResponse getManualAttendanceRoster(Long facultyId, LocalDate date, String department, String section, Long subjectId, Integer period);
    AppDTO.ManualAttendanceRosterResponse saveManualAttendanceRoster(Long facultyId, AppDTO.SaveManualAttendanceRequest request);
    List<AppDTO.AttendanceResponse> markManualBatch(Long facultyId, Long courseId, LocalDate date, List<AppDTO.AttendanceRequest> records);
    List<AppDTO.AttendanceResponse> markManualBatchWithSession(Long facultyId, Long sessionId, List<AppDTO.AttendanceRequest> records);
    List<AppDTO.AttendanceResponse> getCourseAttendance(Long courseId, LocalDate date);
    List<AppDTO.AttendanceResponse> getStudentAttendanceHistory(Long studentId);
    Map<String, Object> getStudentAttendanceSummary(Long studentId);
    Map<String, Object> getInstitutionAttendanceSummary();

    // Faculty Views
    List<AppDTO.AttendanceSessionDTO> getFacultyAttendanceHistory(Long facultyId, Long subjectId, String section, LocalDate fromDate, LocalDate toDate);
    AppDTO.AttendanceSubjectSummaryDTO getFacultySubjectSummary(Long facultyId, Long subjectId);
    List<AppDTO.AttendanceSubjectSummaryDTO> getAllFacultySubjectSummaries(Long facultyId);

    // Student Dedicated Views
    List<AppDTO.AttendanceSubjectSummaryDTO> getStudentSubjectWiseAttendance(Long studentId);
    List<AppDTO.AttendanceResponse> getStudentDateWiseAttendance(Long studentId, LocalDate fromDate, LocalDate toDate, Long subjectId, String status);

    // Admin Reports & Authority
    Map<String, Object> getAdminAttendanceOverview(Long departmentId, Long courseId, Integer semester, String section, Long subjectId, LocalDate fromDate, LocalDate toDate);
    List<AppDTO.ShortageStudentDTO> getAdminShortageReport(Double thresholdPct, Long departmentId, Long courseId, Integer semester, String section);
    AppDTO.AttendanceResponse adminManualCorrection(Long attendanceId, String newStatus, String reason, Long adminId);

    // Correction Requests
    AppDTO.AttendanceCorrectionDTO submitCorrectionRequest(Long studentId, AppDTO.AttendanceCorrectionDTO request);
    List<AppDTO.AttendanceCorrectionDTO> getPendingCorrections();
    List<AppDTO.AttendanceCorrectionDTO> getStudentCorrections(Long studentId);
    AppDTO.AttendanceCorrectionDTO reviewCorrection(Long correctionId, Long facultyId, boolean approve, String remarks);
}
