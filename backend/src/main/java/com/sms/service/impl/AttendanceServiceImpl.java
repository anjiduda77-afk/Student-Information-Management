package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.Attendance;
import com.sms.entity.AttendanceCorrection;
import com.sms.entity.AttendanceSession;
import com.sms.entity.Course;
import com.sms.entity.User;
import com.sms.exception.ConflictException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import com.sms.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceCorrectionRepository correctionRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private String generateUniqueCode() {
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return sb.toString();
    }

    @Override
    @Transactional
    public AppDTO.AttendanceSessionDTO startAttendanceSession(Long facultyId, Long courseId, String section, String sessionType) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with ID: " + facultyId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + courseId));

        String code = generateUniqueCode();
        // Sessions expire in 15 minutes by default
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(15);

        AttendanceSession.SessionType sType = "ONLINE_QR".equalsIgnoreCase(sessionType)
                ? AttendanceSession.SessionType.ONLINE_QR
                : AttendanceSession.SessionType.ONLINE_CODE;

        AttendanceSession session = AttendanceSession.builder()
                .sessionCode(code)
                .faculty(faculty)
                .course(course)
                .date(LocalDate.now())
                .section(section != null ? section : "A")
                .createdAt(now)
                .expiresAt(expiresAt)
                .status(AttendanceSession.Status.ACTIVE)
                .sessionType(sType)
                .build();

        AttendanceSession saved = sessionRepository.save(session);

        return AppDTO.AttendanceSessionDTO.builder()
                .id(saved.getId())
                .sessionCode(saved.getSessionCode())
                .subjectName(course.getName())
                .facultyId(faculty.getId())
                .facultyName(faculty.getName())
                .date(saved.getDate())
                .section(saved.getSection())
                .createdAt(saved.getCreatedAt())
                .expiresAt(saved.getExpiresAt())
                .status(saved.getStatus().name())
                .sessionType(saved.getSessionType().name())
                .presentCount(0)
                .build();
    }

    @Override
    @Transactional
    public AppDTO.AttendanceResponse checkInWithCode(Long studentId, AppDTO.CheckInRequest request) {
        if (request.getSessionCode() == null || request.getSessionCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Attendance code is required");
        }

        String cleanCode = request.getSessionCode().trim().toUpperCase();
        AttendanceSession session = sessionRepository.findBySessionCode(cleanCode)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid attendance code. Session does not exist."));

        if (session.getStatus() != AttendanceSession.Status.ACTIVE) {
            throw new ConflictException("Attendance session is already closed or locked.");
        }

        if (session.getExpiresAt() != null && LocalDateTime.now().isAfter(session.getExpiresAt())) {
            session.setStatus(AttendanceSession.Status.CLOSED);
            sessionRepository.save(session);
            throw new ConflictException("Attendance session has expired. Check-in is closed.");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        // Check duplicate attendance in this session or date
        if (attendanceRepository.existsByStudentIdAndSessionId(studentId, session.getId())) {
            throw new ConflictException("Attendance has already been marked for this session.");
        }

        // Resolve course from session first, then fallback to faculty's first course
        Course course = session.getCourse();
        if (course == null && session.getFaculty() != null && session.getFaculty().getCourses() != null) {
            course = session.getFaculty().getCourses().stream().findFirst().orElse(null);
        }
        if (course != null && attendanceRepository.existsByStudentIdAndCourseIdAndDate(studentId, course.getId(), session.getDate())) {
            throw new ConflictException("Attendance already recorded for this subject on " + session.getDate());
        }

        Attendance attendance = Attendance.builder()
                .student(student)
                .course(course)
                .session(session)
                .date(session.getDate())
                .status(Attendance.Status.PRESENT)
                .verificationMethod(request.getVerificationMethod() != null ? request.getVerificationMethod() : "ONLINE_CODE")
                .markedAt(LocalDateTime.now())
                .isLocked(false)
                .build();

        Attendance saved = attendanceRepository.save(attendance);
        return AppDTO.AttendanceResponse.from(saved);
    }

    @Override
    @Transactional
    public void closeAttendanceSession(Long sessionId) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        session.setStatus(AttendanceSession.Status.CLOSED);
        sessionRepository.save(session);
    }

    @Override
    public AppDTO.AttendanceSessionDTO getSessionStatus(Long sessionId) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        long count = attendanceRepository.findBySessionId(sessionId).stream()
                .filter(a -> a.getStatus() == Attendance.Status.PRESENT)
                .count();

        return AppDTO.AttendanceSessionDTO.builder()
                .id(session.getId())
                .sessionCode(session.getSessionCode())
                .facultyId(session.getFaculty().getId())
                .facultyName(session.getFaculty().getName())
                .date(session.getDate())
                .section(session.getSection())
                .createdAt(session.getCreatedAt())
                .expiresAt(session.getExpiresAt())
                .status(session.getStatus().name())
                .sessionType(session.getSessionType().name())
                .presentCount(count)
                .build();
    }

    @Override
    @Transactional
    public List<AppDTO.AttendanceResponse> markManualBatch(Long facultyId, Long courseId, LocalDate date, List<AppDTO.AttendanceRequest> records) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        List<Attendance> results = new ArrayList<>();

        for (AppDTO.AttendanceRequest req : records) {
            User student = userRepository.findById(req.getStudentId()).orElse(null);
            if (student == null) continue;

            Optional<Attendance> existing = attendanceRepository.findByStudentIdAndCourseIdAndDate(student.getId(), course.getId(), date);
            Attendance att;
            if (existing.isPresent()) {
                att = existing.get();
                att.setStatus(req.getStatus() != null ? req.getStatus() : Attendance.Status.PRESENT);
                att.setMarkedAt(LocalDateTime.now());
                att.setVerificationMethod("MANUAL");
                att.setIsLocked(true);
            } else {
                att = Attendance.builder()
                        .student(student)
                        .course(course)
                        .date(date)
                        .status(req.getStatus() != null ? req.getStatus() : Attendance.Status.PRESENT)
                        .verificationMethod("MANUAL")
                        .markedAt(LocalDateTime.now())
                        .isLocked(true)
                        .build();
            }
            results.add(attendanceRepository.save(att));
        }

        return results.stream().map(AppDTO.AttendanceResponse::from).collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.AttendanceResponse> getCourseAttendance(Long courseId, LocalDate date) {
        List<Attendance> list = (date != null)
                ? attendanceRepository.findByCourseIdAndDate(courseId, date)
                : attendanceRepository.findAll().stream().filter(a -> a.getCourse() != null && a.getCourse().getId().equals(courseId)).collect(Collectors.toList());

        return list.stream().map(AppDTO.AttendanceResponse::from).collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.AttendanceResponse> getStudentAttendanceHistory(Long studentId) {
        return attendanceRepository.findByStudentId(studentId).stream()
                .map(AppDTO.AttendanceResponse::from)
                .sorted(Comparator.comparing(AppDTO.AttendanceResponse::getDate).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getStudentAttendanceSummary(Long studentId) {
        List<Attendance> all = attendanceRepository.findByStudentId(studentId);
        long total = all.size();
        long present = all.stream().filter(a -> a.getStatus() == Attendance.Status.PRESENT).count();
        long absent = all.stream().filter(a -> a.getStatus() == Attendance.Status.ABSENT).count();
        long late = all.stream().filter(a -> a.getStatus() == Attendance.Status.LATE).count();
        long excused = all.stream().filter(a -> a.getStatus() == Attendance.Status.EXCUSED).count();

        double overallPct = total > 0 ? Math.round(((present + (late * 0.5)) * 100.0 / total) * 10.0) / 10.0 : 0.0;

        // Group by course
        Map<String, List<Attendance>> byCourse = all.stream()
                .filter(a -> a.getCourse() != null)
                .collect(Collectors.groupingBy(a -> a.getCourse().getName()));

        List<Map<String, Object>> courseBreakdown = new ArrayList<>();
        for (Map.Entry<String, List<Attendance>> entry : byCourse.entrySet()) {
            List<Attendance> cList = entry.getValue();
            long cTotal = cList.size();
            long cPres = cList.stream().filter(a -> a.getStatus() == Attendance.Status.PRESENT).count();
            double cPct = cTotal > 0 ? Math.round((cPres * 100.0 / cTotal) * 10.0) / 10.0 : 0.0;
            courseBreakdown.add(Map.of(
                    "courseName", entry.getKey(),
                    "totalClasses", cTotal,
                    "presentClasses", cPres,
                    "percentage", cPct,
                    "lowAttendance", cPct < 75.0
            ));
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalClasses", total);
        summary.put("presentCount", present);
        summary.put("absentCount", absent);
        summary.put("lateCount", late);
        summary.put("excusedCount", excused);
        summary.put("overallPercentage", overallPct);
        summary.put("isShortageAlert", overallPct < 75.0 && total > 0);
        summary.put("courseBreakdown", courseBreakdown);

        return summary;
    }

    @Override
    public Map<String, Object> getInstitutionAttendanceSummary() {
        long total = attendanceRepository.countAllAttendance();
        long present = attendanceRepository.countAllPresent();
        double overallPct = total > 0 ? Math.round((present * 100.0 / total) * 10.0) / 10.0 : 0.0;

        return Map.of(
                "totalRecords", total,
                "presentCount", present,
                "overallPercentage", overallPct
        );
    }

    // ================= Correction Requests =================

    @Override
    @Transactional
    public AppDTO.AttendanceCorrectionDTO submitCorrectionRequest(Long studentId, AppDTO.AttendanceCorrectionDTO request) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        Course course = null;
        if (request.getCourseId() != null) {
            course = courseRepository.findById(request.getCourseId()).orElse(null);
        }

        AttendanceCorrection corr = AttendanceCorrection.builder()
                .student(student)
                .course(course)
                .attendanceDate(request.getAttendanceDate() != null ? request.getAttendanceDate() : LocalDate.now())
                .previousStatus(request.getPreviousStatus() != null ? request.getPreviousStatus() : "ABSENT")
                .requestedStatus(request.getRequestedStatus() != null ? request.getRequestedStatus() : "PRESENT")
                .reason(request.getReason())
                .status(AttendanceCorrection.Status.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        AttendanceCorrection saved = correctionRepository.save(corr);

        return AppDTO.AttendanceCorrectionDTO.builder()
                .id(saved.getId())
                .studentId(student.getId())
                .studentName(student.getName())
                .rollNumber(student.getRollNumber())
                .courseId(course != null ? course.getId() : null)
                .courseName(course != null ? course.getName() : "Subject")
                .attendanceDate(saved.getAttendanceDate())
                .previousStatus(saved.getPreviousStatus())
                .requestedStatus(saved.getRequestedStatus())
                .reason(saved.getReason())
                .status(saved.getStatus().name())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Override
    public List<AppDTO.AttendanceCorrectionDTO> getPendingCorrections() {
        return correctionRepository.findByStatus(AttendanceCorrection.Status.PENDING).stream()
                .map(c -> AppDTO.AttendanceCorrectionDTO.builder()
                        .id(c.getId())
                        .studentId(c.getStudent().getId())
                        .studentName(c.getStudent().getName())
                        .rollNumber(c.getStudent().getRollNumber())
                        .courseId(c.getCourse() != null ? c.getCourse().getId() : null)
                        .courseName(c.getCourse() != null ? c.getCourse().getName() : "General")
                        .attendanceDate(c.getAttendanceDate())
                        .previousStatus(c.getPreviousStatus())
                        .requestedStatus(c.getRequestedStatus())
                        .reason(c.getReason())
                        .status(c.getStatus().name())
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.AttendanceCorrectionDTO> getStudentCorrections(Long studentId) {
        return correctionRepository.findByStudentId(studentId).stream()
                .map(c -> AppDTO.AttendanceCorrectionDTO.builder()
                        .id(c.getId())
                        .studentId(c.getStudent().getId())
                        .studentName(c.getStudent().getName())
                        .rollNumber(c.getStudent().getRollNumber())
                        .courseId(c.getCourse() != null ? c.getCourse().getId() : null)
                        .courseName(c.getCourse() != null ? c.getCourse().getName() : "General")
                        .attendanceDate(c.getAttendanceDate())
                        .previousStatus(c.getPreviousStatus())
                        .requestedStatus(c.getRequestedStatus())
                        .reason(c.getReason())
                        .status(c.getStatus().name())
                        .remarks(c.getRemarks())
                        .createdAt(c.getCreatedAt())
                        .reviewedAt(c.getReviewedAt())
                        .reviewedByName(c.getReviewedBy() != null ? c.getReviewedBy().getName() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppDTO.AttendanceCorrectionDTO reviewCorrection(Long correctionId, Long facultyId, boolean approve, String remarks) {
        AttendanceCorrection corr = correctionRepository.findById(correctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Correction request not found"));
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        corr.setStatus(approve ? AttendanceCorrection.Status.APPROVED : AttendanceCorrection.Status.REJECTED);
        corr.setReviewedBy(faculty);
        corr.setRemarks(remarks);
        corr.setReviewedAt(LocalDateTime.now());

        if (approve && corr.getCourse() != null) {
            // Update actual attendance record
            Optional<Attendance> attOpt = attendanceRepository.findByStudentIdAndCourseIdAndDate(
                    corr.getStudent().getId(), corr.getCourse().getId(), corr.getAttendanceDate());

            if (attOpt.isPresent()) {
                Attendance att = attOpt.get();
                att.setStatus(Attendance.Status.valueOf(corr.getRequestedStatus().toUpperCase()));
                att.setVerificationMethod("CORRECTED_BY_FACULTY");
                attendanceRepository.save(att);
            } else {
                Attendance att = Attendance.builder()
                        .student(corr.getStudent())
                        .course(corr.getCourse())
                        .date(corr.getAttendanceDate())
                        .status(Attendance.Status.valueOf(corr.getRequestedStatus().toUpperCase()))
                        .verificationMethod("CORRECTED_BY_FACULTY")
                        .markedAt(LocalDateTime.now())
                        .build();
                attendanceRepository.save(att);
            }
        }

        AttendanceCorrection saved = correctionRepository.save(corr);
        return AppDTO.AttendanceCorrectionDTO.builder()
                .id(saved.getId())
                .status(saved.getStatus().name())
                .remarks(saved.getRemarks())
                .reviewedAt(saved.getReviewedAt())
                .reviewedByName(faculty.getName())
                .build();
    }
}
