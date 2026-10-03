package com.sms.controller;

import com.sms.dto.AppDTO;
import com.sms.service.CourseSubjectService;
import com.sms.service.TimetableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CourseController {

    private final CourseSubjectService courseSubjectService;
    private final TimetableService timetableService;

    // ==================== Courses ====================

    @GetMapping("/courses")
    public ResponseEntity<List<AppDTO.CourseResponse>> getAllCourses() {
        return ResponseEntity.ok(courseSubjectService.getAllCourses());
    }

    @GetMapping("/courses/{id}")
    public ResponseEntity<?> getCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseSubjectService.getCourseById(id));
    }

    @PostMapping("/courses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCourse(@Valid @RequestBody AppDTO.CourseRequest req) {
        return ResponseEntity.ok(courseSubjectService.createCourse(req));
    }

    @PutMapping("/courses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateCourse(@PathVariable Long id, @Valid @RequestBody AppDTO.CourseRequest req) {
        return ResponseEntity.ok(courseSubjectService.updateCourse(id, req));
    }

    @DeleteMapping("/courses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        courseSubjectService.deleteCourse(id);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Course deleted"));
    }

    // ==================== Subjects ====================

    @GetMapping("/subjects")
    public ResponseEntity<List<AppDTO.SubjectDTO>> getAllSubjects() {
        return ResponseEntity.ok(courseSubjectService.getAllSubjects());
    }

    @GetMapping("/subjects/{id}")
    public ResponseEntity<?> getSubject(@PathVariable Long id) {
        return ResponseEntity.ok(courseSubjectService.getSubjectById(id));
    }

    @PostMapping("/subjects")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<?> createSubject(@Valid @RequestBody AppDTO.SubjectDTO req) {
        return ResponseEntity.ok(courseSubjectService.createSubject(req));
    }

    @PutMapping("/subjects/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<?> updateSubject(@PathVariable Long id, @Valid @RequestBody AppDTO.SubjectDTO req) {
        return ResponseEntity.ok(courseSubjectService.updateSubject(id, req));
    }

    @DeleteMapping("/subjects/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteSubject(@PathVariable Long id) {
        courseSubjectService.deleteSubject(id);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Subject deleted"));
    }

    @GetMapping("/subjects/by-course/{courseId}")
    public ResponseEntity<List<AppDTO.SubjectDTO>> getSubjectsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseSubjectService.getSubjectsByCourse(courseId));
    }

    // ==================== Timetable (Public Read) ====================

    @GetMapping("/timetable")
    public ResponseEntity<List<AppDTO.TimetableDTO>> getAllTimetable() {
        return ResponseEntity.ok(timetableService.getAllTimetables());
    }

    @GetMapping("/timetable/schedule")
    public ResponseEntity<List<AppDTO.TimetableDTO>> getSchedule(
            @RequestParam Long courseId,
            @RequestParam Integer semester,
            @RequestParam(defaultValue = "A") String section) {
        return ResponseEntity.ok(timetableService.getWeeklySchedule(courseId, semester, section));
    }

    @PostMapping("/timetable")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<?> createTimetable(@Valid @RequestBody AppDTO.TimetableDTO req) {
        return ResponseEntity.ok(timetableService.createTimetable(req));
    }

    @PutMapping("/timetable/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<?> updateTimetable(@PathVariable Long id, @Valid @RequestBody AppDTO.TimetableDTO req) {
        return ResponseEntity.ok(timetableService.updateTimetable(id, req));
    }

    @DeleteMapping("/timetable/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<?> deleteTimetable(@PathVariable Long id) {
        timetableService.deleteTimetable(id);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Timetable entry deleted"));
    }
}
