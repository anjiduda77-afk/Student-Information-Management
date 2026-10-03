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
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasAnyRole('STUDENT','ADMIN','FACULTY')")
@RequiredArgsConstructor
public class StudentController {

    private final AttendanceService attendanceService;
    private final MarksService marksService;
    private final CourseSubjectService courseSubjectService;
    private final EventService eventService;
    private final CertificateService certificateService;
    private final TimetableService timetableService;
    private final AnnouncementNotificationService announcementService;
    private final UserRepository userRepository;

    private User getCurrentUser(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername()).orElseThrow();
    }

    // ==================== Profile ====================

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(AppDTO.UserResponse.from(getCurrentUser(ud)));
    }

    // ==================== Courses ====================

    @GetMapping("/courses")
    public ResponseEntity<List<AppDTO.CourseResponse>> getMyCourses(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(courseSubjectService.getCoursesByStudent(u.getId()));
    }

    // ==================== Attendance ====================

    @GetMapping("/attendance")
    public ResponseEntity<List<AppDTO.AttendanceResponse>> getMyAttendance(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(attendanceService.getStudentAttendanceHistory(u.getId()));
    }

    @GetMapping("/attendance/summary")
    public ResponseEntity<Map<String, Object>> getAttendanceSummary(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(attendanceService.getStudentAttendanceSummary(u.getId()));
    }

    @PostMapping("/attendance/check-in")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> checkIn(@AuthenticationPrincipal UserDetails ud,
                                     @Valid @RequestBody AppDTO.CheckInRequest request) {
        User u = getCurrentUser(ud);
        if (u.getRole() != User.Role.STUDENT) {
            return ResponseEntity.status(403).body(new AppDTO.MessageResponse("Only students can check-in."));
        }
        return ResponseEntity.ok(attendanceService.checkInWithCode(u.getId(), request));
    }

    @PostMapping("/attendance/correction")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitCorrectionRequest(@AuthenticationPrincipal UserDetails ud,
                                                     @Valid @RequestBody AppDTO.AttendanceCorrectionDTO request) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(attendanceService.submitCorrectionRequest(u.getId(), request));
    }

    @GetMapping("/attendance/corrections")
    public ResponseEntity<List<AppDTO.AttendanceCorrectionDTO>> getMyCorrections(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(attendanceService.getStudentCorrections(u.getId()));
    }

    // ==================== Marks & Grades ====================

    @GetMapping("/marks")
    public ResponseEntity<List<AppDTO.MarksResponse>> getMyMarks(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(marksService.getStudentMarks(u.getId()));
    }

    @GetMapping("/marks/performance")
    public ResponseEntity<Map<String, Object>> getPerformanceSummary(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(marksService.getStudentPerformanceSummary(u.getId()));
    }

    // ==================== Timetable ====================

    @GetMapping("/timetable")
    public ResponseEntity<List<AppDTO.TimetableDTO>> getMyTimetable(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(timetableService.getStudentSchedule(u.getId()));
    }

    // ==================== Events ====================

    @GetMapping("/events")
    public ResponseEntity<List<AppDTO.EventDTO>> getUpcomingEvents(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(eventService.getUpcomingEvents(u.getId()));
    }

    @GetMapping("/events/all")
    public ResponseEntity<List<AppDTO.EventDTO>> getAllEvents(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(eventService.getAllEvents(u.getId()));
    }

    @GetMapping("/events/{eventId}")
    public ResponseEntity<?> getEventDetails(@PathVariable Long eventId,
                                             @AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(eventService.getEventById(eventId, u.getId()));
    }

    @PostMapping("/events/{eventId}/register")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> registerForEvent(@PathVariable Long eventId,
                                              @AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        if (u.getRole() != User.Role.STUDENT) {
            return ResponseEntity.status(403).body(new AppDTO.MessageResponse("Only students can register for events."));
        }
        return ResponseEntity.ok(eventService.registerStudent(eventId, u.getId()));
    }

    @DeleteMapping("/events/{eventId}/cancel")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> cancelEventRegistration(@PathVariable Long eventId,
                                                     @AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        eventService.cancelRegistration(eventId, u.getId());
        return ResponseEntity.ok(new AppDTO.MessageResponse("Registration cancelled"));
    }

    @GetMapping("/events/my-registrations")
    public ResponseEntity<List<AppDTO.EventParticipantDTO>> getMyRegistrations(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(eventService.getStudentRegistrations(u.getId()));
    }

    // ==================== Certificates ====================

    @GetMapping("/certificates")
    public ResponseEntity<List<AppDTO.CertificateDTO>> getMyCertificates(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(certificateService.getCertificatesByStudent(u.getId()));
    }

    @GetMapping("/certificates/{certificateId}")
    public ResponseEntity<?> getCertificate(@PathVariable String certificateId,
                                            @AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        AppDTO.CertificateDTO cert = certificateService.getCertificateByCode(certificateId);
        // Security: only own certificate
        if (!cert.getStudentId().equals(u.getId()) && u.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(new AppDTO.MessageResponse("Access denied"));
        }
        return ResponseEntity.ok(cert);
    }

    // ==================== Notifications ====================

    @GetMapping("/notifications")
    public ResponseEntity<List<AppDTO.NotificationDTO>> getNotifications(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(announcementService.getUserNotifications(u.getId()));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(Map.of("count", announcementService.getUnreadCount(u.getId())));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        announcementService.markNotificationAsRead(id);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Notification marked as read"));
    }

    @PatchMapping("/notifications/read-all")
    public ResponseEntity<?> markAllRead(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        announcementService.markAllNotificationsAsRead(u.getId());
        return ResponseEntity.ok(new AppDTO.MessageResponse("All notifications marked as read"));
    }

    // ==================== Announcements ====================

    @GetMapping("/announcements")
    public ResponseEntity<List<AppDTO.AnnouncementDTO>> getAnnouncements(@AuthenticationPrincipal UserDetails ud) {
        User u = getCurrentUser(ud);
        return ResponseEntity.ok(announcementService.getActiveAnnouncements(u.getRole().name()));
    }
}
