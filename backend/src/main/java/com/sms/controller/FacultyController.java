package com.sms.controller;

import com.sms.dto.AppDTO;
import com.sms.entity.User;
import com.sms.repository.UserRepository;
import com.sms.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/faculty")
@PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
@Validated
@RequiredArgsConstructor
public class FacultyController {

    private final FacultyService facultyService;
    private final CourseSubjectService courseSubjectService;
    private final AttendanceService attendanceService;
    private final MarksService marksService;
    private final EventService eventService;
    private final CertificateService certificateService;
    private final TimetableService timetableService;
    private final AnnouncementNotificationService notificationService;
    private final UserRepository userRepository;

    private User getCurrentUser(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername()).orElseThrow();
    }

    // ==================== Profile ====================

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(AppDTO.UserResponse.from(getCurrentUser(ud)));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserDetails ud,
                                           @RequestBody AppDTO.UserResponse req) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(facultyService.updateFaculty(u.getId(), req));
    }

    // ==================== Courses & Subjects ====================

    @GetMapping("/courses")
    public ResponseEntity<List<AppDTO.CourseResponse>> getMyCourses(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(courseSubjectService.getCoursesByFaculty(u.getId()));
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<AppDTO.SubjectDTO>> getMySubjects(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(courseSubjectService.getSubjectsByFaculty(u.getId()));
    }

    // ==================== Students ====================

    @GetMapping("/courses/{courseId}/students")
    public ResponseEntity<List<AppDTO.UserResponse>> getCourseStudents(@PathVariable Long courseId) {
        // Get all students enrolled in this course
        List<AppDTO.UserResponse> students = userRepository.findByRole(User.Role.STUDENT).stream()
                .filter(s -> s.getCourses().stream().anyMatch(c -> c.getId().equals(courseId)))
                .map(AppDTO.UserResponse::from)
                .toList();
        return ResponseEntity.ok(students);
    }

    // ==================== Attendance ====================

    @GetMapping("/attendance/departments")
    public ResponseEntity<List<AppDTO.DepartmentDTO>> getFacultyAuthorizedDepartments(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(attendanceService.getFacultyAuthorizedDepartments(u.getId()));
    }

    @GetMapping("/attendance/sections")
    public ResponseEntity<List<String>> getFacultyDepartmentSections(@AuthenticationPrincipal UserDetails ud,
                                                                    @RequestParam String department) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(attendanceService.getFacultyDepartmentSections(u.getId(), department));
    }

    @GetMapping("/attendance/roster")
    public ResponseEntity<AppDTO.ManualAttendanceRosterResponse> getManualAttendanceRoster(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(required = false) String date,
            @RequestParam String department,
            @RequestParam String section,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Integer period) {
        User u = getCurrentUser(ud);
        LocalDate parsedDate = (date != null && !date.isBlank()) ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(attendanceService.getManualAttendanceRoster(u.getId(), parsedDate, department, section, subjectId, period));
    }

    @PostMapping("/attendance/save-roster")
    public ResponseEntity<AppDTO.ManualAttendanceRosterResponse> saveManualAttendanceRoster(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody AppDTO.SaveManualAttendanceRequest request) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(attendanceService.saveManualAttendanceRoster(u.getId(), request));
    }

    @GetMapping("/attendance/today-classes")
    public ResponseEntity<List<AppDTO.FacultyTodayClassDTO>> getTodayClasses(@AuthenticationPrincipal UserDetails ud,
                                                                             @RequestParam(required = false) String date) {
        User u = getCurrentUser(ud);
        LocalDate parsedDate = (date != null && !date.isBlank()) ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(attendanceService.getFacultyTodayClasses(u.getId(), parsedDate));
    }

    @PostMapping("/attendance/session/start-from-timetable/{timetableId}")
    public ResponseEntity<AppDTO.AttendanceSessionDTO> startSessionFromTimetable(@AuthenticationPrincipal UserDetails ud,
                                                                                 @PathVariable Long timetableId,
                                                                                 @RequestParam(defaultValue = "ONLINE_QR") String sessionType) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(attendanceService.startSessionFromTimetable(u.getId(), timetableId, sessionType));
    }

    @GetMapping("/attendance/session/{sessionId}/students")
    public ResponseEntity<List<AppDTO.UserResponse>> getSessionStudents(@PathVariable Long sessionId) {
        return ResponseEntity.ok(attendanceService.getSessionStudents(sessionId));
    }

    @PostMapping("/attendance/session/{sessionId}/manual")
    public ResponseEntity<?> markManualBatchWithSession(@AuthenticationPrincipal UserDetails ud,
                                                        @PathVariable Long sessionId,
                                                        @RequestBody List<AppDTO.AttendanceRequest> records) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(attendanceService.markManualBatchWithSession(u.getId(), sessionId, records));
    }

    @GetMapping("/attendance/history")
    public ResponseEntity<List<AppDTO.AttendanceSessionDTO>> getFacultyAttendanceHistory(@AuthenticationPrincipal UserDetails ud,
                                                                                         @RequestParam(required = false) Long subjectId,
                                                                                         @RequestParam(required = false) String section,
                                                                                         @RequestParam(required = false) String fromDate,
                                                                                         @RequestParam(required = false) String toDate) {
        User u = getCurrentUser(ud);
        LocalDate from = (fromDate != null && !fromDate.isBlank()) ? LocalDate.parse(fromDate) : null;
        LocalDate to = (toDate != null && !toDate.isBlank()) ? LocalDate.parse(toDate) : null;
        return ResponseEntity.ok(attendanceService.getFacultyAttendanceHistory(u.getId(), subjectId, section, from, to));
    }

    @GetMapping("/attendance/subject-summary")
    public ResponseEntity<?> getFacultySubjectSummary(@AuthenticationPrincipal UserDetails ud,
                                                      @RequestParam(required = false) Long subjectId) {
        User u = getCurrentUser(ud);
        if (subjectId != null) {
            return ResponseEntity.ok(attendanceService.getFacultySubjectSummary(u.getId(), subjectId));
        } else {
            return ResponseEntity.ok(attendanceService.getAllFacultySubjectSummaries(u.getId()));
        }
    }

    @PostMapping("/attendance/session/start")
    public ResponseEntity<?> startAttendanceSession(@AuthenticationPrincipal UserDetails ud,
                                                    @RequestParam Long courseId,
                                                    @RequestParam(defaultValue = "A") String section,
                                                    @RequestParam(defaultValue = "ONLINE_CODE") String sessionType) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(attendanceService.startAttendanceSession(u.getId(), courseId, section, sessionType));
    }

    @RequestMapping(value = "/attendance/session/{sessionId}/close", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> closeAttendanceSession(@PathVariable Long sessionId) {
        attendanceService.closeAttendanceSession(sessionId);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Attendance session closed"));
    }

    @GetMapping("/attendance/session/{sessionId}/status")
    public ResponseEntity<?> getSessionStatus(@PathVariable Long sessionId) {
        return ResponseEntity.ok(attendanceService.getSessionStatus(sessionId));
    }

    @PostMapping("/attendance/manual")
    public ResponseEntity<?> markManualAttendance(@AuthenticationPrincipal UserDetails ud,
                                                  @RequestParam Long courseId,
                                                  @RequestParam String date,
                                                  @RequestBody List<AppDTO.AttendanceRequest> records) {
        User u = getCurrentUser(ud);
        LocalDate parsedDate = LocalDate.parse(date);
        return ResponseEntity.ok(attendanceService.markManualBatch(u.getId(), courseId, parsedDate, records));
    }

    @GetMapping("/attendance/course/{courseId}")
    public ResponseEntity<?> getCourseAttendance(@PathVariable Long courseId,
                                                 @RequestParam(required = false) String date) {
        LocalDate parsedDate = (date != null) ? LocalDate.parse(date) : null;
        return ResponseEntity.ok(attendanceService.getCourseAttendance(courseId, parsedDate));
    }

    @GetMapping("/attendance/corrections/pending")
    public ResponseEntity<List<AppDTO.AttendanceCorrectionDTO>> getPendingCorrections() {
        return ResponseEntity.ok(attendanceService.getPendingCorrections());
    }

    @PatchMapping("/attendance/corrections/{correctionId}/review")
    public ResponseEntity<?> reviewCorrection(@AuthenticationPrincipal UserDetails ud,
                                              @PathVariable Long correctionId,
                                              @RequestParam boolean approve,
                                              @RequestParam(required = false) String remarks) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(attendanceService.reviewCorrection(correctionId, u.getId(), approve, remarks));
    }

    // ==================== Marks ====================

    @PostMapping("/marks")
    public ResponseEntity<?> uploadMarks(@Valid @RequestBody AppDTO.MarksRequest req) {
        return ResponseEntity.ok(marksService.uploadMarks(req));
    }

    @PostMapping("/marks/batch")
    public ResponseEntity<?> uploadBatchMarks(@RequestParam Long courseId,
                                              @RequestParam String examType,
                                              @RequestParam Double totalMarks,
                                              @RequestBody List<AppDTO.MarksRequest> list) {
        return ResponseEntity.ok(marksService.uploadBatchMarks(courseId, examType, totalMarks, list));
    }

    @GetMapping("/marks/course/{courseId}")
    public ResponseEntity<List<AppDTO.MarksResponse>> getCourseMarks(@PathVariable Long courseId) {
        return ResponseEntity.ok(marksService.getCourseMarks(courseId));
    }

    // ==================== Timetable ====================

    @GetMapping("/timetable")
    public ResponseEntity<List<AppDTO.TimetableDTO>> getMyTimetable(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(timetableService.getFacultySchedule(u.getId()));
    }

    // ==================== Events ====================

    @GetMapping("/events")
    public ResponseEntity<List<AppDTO.EventDTO>> getAllEvents(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(eventService.getAllEvents(u.getId()));
    }

    @PostMapping("/events")
    public ResponseEntity<?> createEvent(@Valid @RequestBody AppDTO.EventDTO req,
                                         @AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(eventService.createEvent(req, u.getId()));
    }

    @PutMapping("/events/{eventId}")
    public ResponseEntity<?> updateEvent(@PathVariable Long eventId, @Valid @RequestBody AppDTO.EventDTO req) {
        return ResponseEntity.ok(eventService.updateEvent(eventId, req));
    }

    @PatchMapping("/events/{eventId}/status")
    public ResponseEntity<?> updateEventStatus(@PathVariable Long eventId, @RequestParam String status) {
        eventService.updateEventStatus(eventId, status);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Event status updated"));
    }

    @GetMapping("/events/{eventId}/participants")
    public ResponseEntity<List<AppDTO.EventParticipantDTO>> getEventParticipants(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.getEventParticipants(eventId));
    }

    @PatchMapping("/events/{eventId}/participants/{studentId}/attendance")
    public ResponseEntity<?> markParticipantAttendance(@PathVariable Long eventId,
                                                       @PathVariable Long studentId,
                                                       @RequestParam String status) {
        eventService.markParticipantAttendance(eventId, studentId, status);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Attendance marked"));
    }

    @PostMapping("/events/{eventId}/results")
    public ResponseEntity<?> recordResult(@PathVariable Long eventId,
                                          @Valid @RequestBody AppDTO.ResultSubmitRequest req,
                                          @AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        eventService.recordResult(eventId, req, u.getId());
        return ResponseEntity.ok(new AppDTO.MessageResponse("Result recorded"));
    }

    // ==================== Certificates ====================

    @GetMapping("/events/{eventId}/certificates")
    public ResponseEntity<List<AppDTO.CertificateDTO>> getEventCertificates(@PathVariable Long eventId) {
        return ResponseEntity.ok(certificateService.getCertificatesByEvent(eventId));
    }

    @PostMapping("/certificates/generate")
    public ResponseEntity<?> generateCertificate(@Valid @RequestBody AppDTO.GenerateCertificateRequest req,
                                                 @AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(certificateService.generateCertificate(req, u.getId()));
    }

    @PostMapping("/events/{eventId}/certificates/batch")
    public ResponseEntity<?> generateBatchCertificates(@PathVariable Long eventId,
                                                       @RequestBody List<AppDTO.GenerateCertificateRequest> reqs,
                                                       @AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(certificateService.generateBatchCertificates(eventId, reqs, u.getId()));
    }

    @GetMapping("/certificate-templates")
    public ResponseEntity<?> getCertificateTemplates() {
        return ResponseEntity.ok(certificateService.getAllTemplates().stream()
                .filter(t -> "PUBLISHED".equalsIgnoreCase(t.getStatus()))
                .toList());
    }

    // ==================== Notifications ====================

    @GetMapping("/notifications")
    public ResponseEntity<List<AppDTO.NotificationDTO>> getNotifications(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(notificationService.getUserNotifications(u.getId()));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(u.getId())));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        notificationService.markNotificationAsRead(id);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Notification marked as read"));
    }

    @PatchMapping("/notifications/read-all")
    public ResponseEntity<?> markAllRead(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        notificationService.markAllNotificationsAsRead(u.getId());
        return ResponseEntity.ok(new AppDTO.MessageResponse("All notifications marked as read"));
    }

    // ==================== Announcements ====================

    @GetMapping("/announcements")
    public ResponseEntity<List<AppDTO.AnnouncementDTO>> getAnnouncements(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(notificationService.getActiveAnnouncements(u.getRole().name()));
    }
}
