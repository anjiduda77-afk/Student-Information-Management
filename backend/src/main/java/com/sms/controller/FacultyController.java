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

    @PostMapping("/attendance/session/start")
    public ResponseEntity<?> startAttendanceSession(@AuthenticationPrincipal UserDetails ud,
                                                    @RequestParam Long courseId,
                                                    @RequestParam(defaultValue = "A") String section,
                                                    @RequestParam(defaultValue = "ONLINE_CODE") String sessionType) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(attendanceService.startAttendanceSession(u.getId(), courseId, section, sessionType));
    }

    @PostMapping("/attendance/session/{sessionId}/close")
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
                                              @RequestBody List<@Valid AppDTO.MarksRequest> list) {
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
        return ResponseEntity.ok(certificateService.getAllTemplates());
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
