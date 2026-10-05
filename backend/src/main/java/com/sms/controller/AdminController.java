package com.sms.controller;

import com.sms.dto.AppDTO;
import com.sms.dto.AuthDTO;
import com.sms.entity.User;
import com.sms.repository.CertificateRepository;
import com.sms.repository.EventRepository;
import com.sms.repository.UserRepository;
import com.sms.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final StudentService studentService;
    private final FacultyService facultyService;
    private final DepartmentService departmentService;
    private final CourseSubjectService courseSubjectService;
    private final AttendanceService attendanceService;
    private final MarksService marksService;
    private final AnnouncementNotificationService announcementService;
    private final ActivityLogService activityLogService;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final CertificateRepository certificateRepository;
    private final com.sms.service.AccountSecurityService accountSecurityService;

    // ==================== Dashboard ====================

    @GetMapping({"/dashboard", "/dashboard/stats"})
    public ResponseEntity<?> getDashboard() {
        List<User> studentUsers = userRepository.findByRole(User.Role.STUDENT);
        long students = studentUsers.size();
        long faculty = userRepository.findByRole(User.Role.FACULTY).size();
        long departments = departmentService.getAllDepartments().size();
        long courses = courseSubjectService.getAllCourses().size();
        long totalEvents = eventRepository.count();
        long certificatesIssued = certificateRepository.count();
        Map<String, Object> attendanceSummary = attendanceService.getInstitutionAttendanceSummary();

        // 1. Department Wise Student Distribution & Enrollment Overview
        Map<String, Long> deptCounts = new LinkedHashMap<>();
        for (User u : studentUsers) {
            String dept = u.getDepartment();
            if (dept == null || dept.isBlank()) {
                dept = u.getBranch();
            }
            if (dept == null || dept.isBlank()) {
                dept = "General";
            }
            deptCounts.put(dept, deptCounts.getOrDefault(dept, 0L) + 1L);
        }

        List<Map<String, Object>> studentEnrollment = deptCounts.entrySet().stream()
                .map(e -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("department", e.getKey());
                    item.put("students", e.getValue());
                    return item;
                })
                .toList();

        List<Map<String, Object>> departmentWiseStudents = deptCounts.entrySet().stream()
                .map(e -> {
                    double pct = (students > 0) ? Math.round((e.getValue() * 100.0 / students) * 10.0) / 10.0 : 0.0;
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", e.getKey());
                    item.put("value", e.getValue());
                    item.put("percentage", pct);
                    return item;
                })
                .toList();

        // 2. Real Events & Activities from Database
        List<Map<String, Object>> recentEvents = eventRepository.findAll().stream()
                .sorted((a, b) -> {
                    if (a.getEventDate() == null && b.getEventDate() == null) return 0;
                    if (a.getEventDate() == null) return 1;
                    if (b.getEventDate() == null) return -1;
                    return b.getEventDate().compareTo(a.getEventDate());
                })
                .limit(5)
                .map(e -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", e.getId());
                    item.put("title", e.getTitle() != null ? e.getTitle() : "Event");
                    item.put("eventDate", e.getEventDate() != null ? e.getEventDate().toString() : "");
                    item.put("venue", e.getVenue() != null ? e.getVenue() : "Campus");
                    item.put("category", e.getCategory() != null ? e.getCategory() : "Academic");
                    item.put("status", e.getStatus() != null ? e.getStatus().name() : "UPCOMING");
                    return item;
                })
                .toList();

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("totalStudents", students);
        resp.put("totalFaculty", faculty);
        resp.put("totalEvents", totalEvents);
        resp.put("totalCertificates", certificatesIssued);
        resp.put("certificatesIssued", certificatesIssued);
        resp.put("totalDepartments", departments);
        resp.put("totalCourses", courses);
        resp.put("attendanceSummary", attendanceSummary);
        resp.put("studentEnrollment", studentEnrollment);
        resp.put("departmentWiseStudents", departmentWiseStudents);
        resp.put("recentEvents", recentEvents);

        return ResponseEntity.ok(resp);
    }

    // ==================== Students ====================

    @GetMapping("/students")
    public ResponseEntity<List<AppDTO.UserResponse>> getAllStudents(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer semester) {
        return ResponseEntity.ok(studentService.getAllStudents(department, semester));
    }

    @GetMapping("/students/{id}")
    public ResponseEntity<?> getStudent(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getStudentById(id));
    }

    @PostMapping("/students")
    public ResponseEntity<?> addStudent(@Valid @RequestBody AuthDTO.RegisterRequest req,
                                        @AuthenticationPrincipal UserDetails ud) {
        AppDTO.UserResponse result = studentService.addStudent(req);
        activityLogService.log(ud.getUsername(), ud.getUsername(), "ADMIN", "CREATE", "STUDENTS",
                "Added student: " + result.getName() + " (" + result.getStudentId() + ")");
        return ResponseEntity.ok(result);
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody AppDTO.UserResponse req,
                                           @AuthenticationPrincipal UserDetails ud) {
        AppDTO.UserResponse result = studentService.updateStudent(id, req);
        activityLogService.log(ud.getUsername(), ud.getUsername(), "ADMIN", "UPDATE", "STUDENTS",
                "Updated student ID: " + id);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/students/{id}/toggle-status")
    public ResponseEntity<?> toggleStudentStatus(@PathVariable Long id) {
        studentService.toggleStudentStatus(id);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Student status updated"));
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        studentService.deleteStudent(id);
        activityLogService.log(ud.getUsername(), ud.getUsername(), "ADMIN", "DELETE", "STUDENTS",
                "Deleted student ID: " + id);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Student record deleted"));
    }

    @PostMapping("/enroll")
    public ResponseEntity<?> enrollStudent(@Valid @RequestBody AppDTO.EnrollRequest req) {
        courseSubjectService.enrollStudent(req.getStudentId(), req.getCourseId());
        return ResponseEntity.ok(new AppDTO.MessageResponse("Student enrolled successfully"));
    }

    // ==================== Faculty ====================

    @GetMapping("/faculty")
    public ResponseEntity<List<AppDTO.UserResponse>> getAllFaculty() {
        return ResponseEntity.ok(facultyService.getAllFaculty());
    }

    @GetMapping("/faculty/{id}")
    public ResponseEntity<?> getFaculty(@PathVariable Long id) {
        return ResponseEntity.ok(facultyService.getFacultyById(id));
    }

    @PostMapping("/faculty")
    public ResponseEntity<?> addFaculty(@Valid @RequestBody AuthDTO.RegisterRequest req,
                                        @AuthenticationPrincipal UserDetails ud) {
        AppDTO.UserResponse result = facultyService.addFaculty(req);
        activityLogService.log(ud.getUsername(), ud.getUsername(), "ADMIN", "CREATE", "FACULTY",
                "Added faculty: " + result.getName() + " (" + result.getFacultyId() + ")");
        return ResponseEntity.ok(result);
    }

    @PutMapping("/faculty/{id}")
    public ResponseEntity<?> updateFaculty(@PathVariable Long id, @RequestBody AppDTO.UserResponse req) {
        return ResponseEntity.ok(facultyService.updateFaculty(id, req));
    }

    @PatchMapping("/faculty/{id}/toggle-status")
    public ResponseEntity<?> toggleFacultyStatus(@PathVariable Long id) {
        facultyService.toggleFacultyStatus(id);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Faculty status updated"));
    }

    // ==================== Departments ====================

    @GetMapping("/departments")
    public ResponseEntity<List<AppDTO.DepartmentDTO>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @PostMapping("/departments")
    public ResponseEntity<?> createDepartment(@Valid @RequestBody AppDTO.DepartmentDTO req) {
        return ResponseEntity.ok(departmentService.createDepartment(req));
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<?> updateDepartment(@PathVariable Long id, @Valid @RequestBody AppDTO.DepartmentDTO req) {
        return ResponseEntity.ok(departmentService.updateDepartment(id, req));
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Department deleted"));
    }

    // ==================== Announcements ====================

    @GetMapping("/announcements")
    public ResponseEntity<List<AppDTO.AnnouncementDTO>> getAnnouncements() {
        return ResponseEntity.ok(announcementService.getAllAnnouncements());
    }

    @PostMapping("/announcements")
    public ResponseEntity<?> createAnnouncement(@Valid @RequestBody AppDTO.AnnouncementDTO req,
                                                @AuthenticationPrincipal UserDetails ud) {
        User admin = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        return ResponseEntity.ok(announcementService.createAnnouncement(req, admin.getId()));
    }

    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Announcement removed"));
    }

    // ==================== Activity / Audit Logs ====================

    @GetMapping({"/activity-logs", "/audit-logs"})
    public ResponseEntity<List<AppDTO.ActivityLogDTO>> getActivityLogs() {
        return ResponseEntity.ok(activityLogService.getRecentLogs());
    }

    // ==================== Password & Account Security ====================

    @PostMapping("/users/{userId}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long userId,
                                           @Valid @RequestBody AppDTO.AdminResetPasswordRequest req,
                                           @AuthenticationPrincipal UserDetails ud) {
        User admin = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        accountSecurityService.adminResetPassword(userId, req.getNewPassword(), req.getForceChangeOnNextLogin(), admin.getId());
        return ResponseEntity.ok(new AppDTO.MessageResponse("Password reset successfully. User will be required to change password on next login if forced."));
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long userId,
                                              @RequestParam String status,
                                              @AuthenticationPrincipal UserDetails ud) {
        User admin = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        accountSecurityService.updateAccountStatus(userId, status, admin.getId());
        return ResponseEntity.ok(new AppDTO.MessageResponse("Account status updated to " + status));
    }

    @PutMapping("/students/{id}/photo")
    public ResponseEntity<?> updateStudentPhoto(@PathVariable Long id,
                                                @Valid @RequestBody AppDTO.UpdatePhotoRequest req,
                                                @AuthenticationPrincipal UserDetails ud) {
        User admin = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        accountSecurityService.updateProfilePhoto(id, req.getPhotoUrl(), admin.getId());
        return ResponseEntity.ok(new AppDTO.MessageResponse("Student profile photo updated successfully"));
    }

    @DeleteMapping("/students/{id}/photo")
    public ResponseEntity<?> removeStudentPhoto(@PathVariable Long id,
                                                @AuthenticationPrincipal UserDetails ud) {
        User admin = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        accountSecurityService.removeProfilePhoto(id, admin.getId());
        return ResponseEntity.ok(new AppDTO.MessageResponse("Student profile photo removed"));
    }

    @PutMapping("/faculty/{id}/photo")
    public ResponseEntity<?> updateFacultyPhoto(@PathVariable Long id,
                                               @Valid @RequestBody AppDTO.UpdatePhotoRequest req,
                                               @AuthenticationPrincipal UserDetails ud) {
        User admin = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        accountSecurityService.updateProfilePhoto(id, req.getPhotoUrl(), admin.getId());
        return ResponseEntity.ok(new AppDTO.MessageResponse("Faculty profile photo updated successfully"));
    }

    @DeleteMapping("/faculty/{id}/photo")
    public ResponseEntity<?> removeFacultyPhoto(@PathVariable Long id,
                                               @AuthenticationPrincipal UserDetails ud) {
        User admin = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        accountSecurityService.removeProfilePhoto(id, admin.getId());
        return ResponseEntity.ok(new AppDTO.MessageResponse("Faculty profile photo removed"));
    }

    // ==================== Attendance Oversight & Reports ====================

    @GetMapping("/attendance/overview")
    public ResponseEntity<?> getAttendanceOverview(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        LocalDate from = (fromDate != null && !fromDate.isBlank()) ? LocalDate.parse(fromDate) : null;
        LocalDate to = (toDate != null && !toDate.isBlank()) ? LocalDate.parse(toDate) : null;
        return ResponseEntity.ok(attendanceService.getAdminAttendanceOverview(departmentId, courseId, semester, section, subjectId, from, to));
    }

    @GetMapping("/attendance/shortage-report")
    public ResponseEntity<List<AppDTO.ShortageStudentDTO>> getShortageReport(
            @RequestParam(defaultValue = "75.0") Double thresholdPct,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String section) {
        return ResponseEntity.ok(attendanceService.getAdminShortageReport(thresholdPct, departmentId, courseId, semester, section));
    }

    @RequestMapping(value = "/attendance/{id}/correct", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> adminManualCorrection(
            @PathVariable Long id,
            @RequestParam(required = false) String newStatus,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "Authorised by Administrator") String reason,
            @AuthenticationPrincipal UserDetails ud) {
        User admin = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        String effectiveStatus = newStatus != null ? newStatus : status;
        if (effectiveStatus == null) effectiveStatus = "PRESENT";
        return ResponseEntity.ok(attendanceService.adminManualCorrection(id, effectiveStatus, reason, admin.getId()));
    }

    // ==================== Reports ====================

    @GetMapping("/reports/overview")
    public ResponseEntity<?> getOverviewReport() {
        long students = userRepository.findByRole(User.Role.STUDENT).size();
        long faculty = userRepository.findByRole(User.Role.FACULTY).size();
        long departments = departmentService.getAllDepartments().size();
        long courses = courseSubjectService.getAllCourses().size();
        Map<String, Object> attendance = attendanceService.getInstitutionAttendanceSummary();

        return ResponseEntity.ok(Map.of(
                "totalStudents", students,
                "totalFaculty", faculty,
                "totalDepartments", departments,
                "totalCourses", courses,
                "institutionAttendance", attendance
        ));
    }
}
