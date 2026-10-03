package com.sms.controller;

import com.sms.dto.AppDTO;
import com.sms.dto.AuthDTO;
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

    // ==================== Dashboard ====================

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        long students = userRepository.findByRole(User.Role.STUDENT).size();
        long faculty = userRepository.findByRole(User.Role.FACULTY).size();
        long departments = departmentService.getAllDepartments().size();
        long courses = courseSubjectService.getAllCourses().size();
        Map<String, Object> attendanceSummary = attendanceService.getInstitutionAttendanceSummary();
        List<AppDTO.ActivityLogDTO> recentLogs = activityLogService.getRecentLogs();

        return ResponseEntity.ok(Map.of(
                "totalStudents", students,
                "totalFaculty", faculty,
                "totalDepartments", departments,
                "totalCourses", courses,
                "attendanceSummary", attendanceSummary,
                "recentActivities", recentLogs.stream().limit(10).toList()
        ));
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

    // ==================== Activity Logs ====================

    @GetMapping("/activity-logs")
    public ResponseEntity<List<AppDTO.ActivityLogDTO>> getActivityLogs() {
        return ResponseEntity.ok(activityLogService.getRecentLogs());
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
