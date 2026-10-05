package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.*;
import com.sms.exception.ConflictException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import com.sms.service.ActivityLogService;
import com.sms.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
    private final TimetableRepository timetableRepository;
    private final SubjectRepository subjectRepository;
    private final DepartmentRepository departmentRepository;
    private final ActivityLogService activityLogService;

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private String generateUniqueCode() {
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return sb.toString();
    }

    private AppDTO.AttendanceSessionDTO toSessionDTO(AttendanceSession session) {
        long present = attendanceRepository.findBySessionId(session.getId()).stream()
                .filter(a -> a.getStatus() == Attendance.Status.PRESENT)
                .count();
        long absent = attendanceRepository.findBySessionId(session.getId()).stream()
                .filter(a -> a.getStatus() == Attendance.Status.ABSENT)
                .count();
        long late = attendanceRepository.findBySessionId(session.getId()).stream()
                .filter(a -> a.getStatus() == Attendance.Status.LATE)
                .count();
        long excused = attendanceRepository.findBySessionId(session.getId()).stream()
                .filter(a -> a.getStatus() == Attendance.Status.EXCUSED)
                .count();

        long total = userRepository.findByRole(User.Role.STUDENT).stream()
                .filter(s -> {
                    if (session.getCourse() != null && s.getCourses() != null && !s.getCourses().isEmpty()) {
                        if (!s.getCourses().contains(session.getCourse())) return false;
                    }
                    if (session.getSection() != null && s.getSection() != null && !session.getSection().equalsIgnoreCase(s.getSection())) {
                        return false;
                    }
                    return true;
                }).count();

        String subName = session.getSubject() != null ? session.getSubject().getName()
                : (session.getCourse() != null ? session.getCourse().getName() : "Subject");
        String subCode = session.getSubject() != null ? session.getSubject().getCode()
                : (session.getCourse() != null ? session.getCourse().getCode() : "SUB");
        String deptName = session.getDepartment() != null ? session.getDepartment().getName()
                : (session.getCourse() != null && session.getCourse().getDepartment() != null ? session.getCourse().getDepartment().getName() : null);

        return AppDTO.AttendanceSessionDTO.builder()
                .id(session.getId())
                .sessionCode(session.getSessionCode())
                .courseId(session.getCourse() != null ? session.getCourse().getId() : null)
                .courseName(session.getCourse() != null ? session.getCourse().getName() : null)
                .departmentId(session.getDepartment() != null ? session.getDepartment().getId() : null)
                .departmentName(deptName)
                .subjectId(session.getSubject() != null ? session.getSubject().getId() : null)
                .subjectName(subName)
                .subjectCode(subCode)
                .facultyId(session.getFaculty() != null ? session.getFaculty().getId() : null)
                .facultyName(session.getFaculty() != null ? session.getFaculty().getName() : null)
                .date(session.getDate())
                .period(session.getPeriod() != null ? session.getPeriod() : 1)
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .room(session.getRoom())
                .section(session.getSection())
                .academicYear(session.getAcademicYear())
                .semester(session.getSemester())
                .createdAt(session.getCreatedAt())
                .expiresAt(session.getExpiresAt())
                .status(session.getStatus().name())
                .sessionType(session.getSessionType().name())
                .totalStudents(total > 0 ? total : 58)
                .presentCount(present)
                .absentCount(absent)
                .lateCount(late)
                .excusedCount(excused)
                .build();
    }

    // ================= Timetable & Today's Classes Integration =================

    @Override
    public List<AppDTO.FacultyTodayClassDTO> getFacultyTodayClasses(Long facultyId, LocalDate date) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        Timetable.DayOfWeek dayOfWeek = null;
        try {
            dayOfWeek = Timetable.DayOfWeek.valueOf(queryDate.getDayOfWeek().name());
        } catch (Exception ignored) {}

        List<Timetable> timetableList = (dayOfWeek != null)
                ? timetableRepository.findByFacultyIdAndDayOfWeek(facultyId, dayOfWeek)
                : Collections.emptyList();

        if (timetableList.isEmpty()) {
            // Fallback: faculty schedule so classes are testable anytime (including weekends)
            timetableList = timetableRepository.findByFacultyId(facultyId);
        }

        timetableList.sort(Comparator.comparing(t -> t.getStartTime() != null ? t.getStartTime() : LocalTime.MIN));

        List<AttendanceSession> todaySessions = sessionRepository.findByFacultyIdAndDate(facultyId, queryDate);

        List<AppDTO.FacultyTodayClassDTO> result = new ArrayList<>();
        for (Timetable t : timetableList) {
            AttendanceSession matchedSession = todaySessions.stream()
                    .filter(s -> {
                        if (t.getSubject() != null && s.getSubject() != null) {
                            return s.getSubject().getId().equals(t.getSubject().getId())
                                    && s.getSection().equalsIgnoreCase(t.getSection());
                        }
                        return s.getCourse().getId().equals(t.getCourse().getId())
                                && s.getSection().equalsIgnoreCase(t.getSection());
                    })
                    .findFirst()
                    .orElse(null);

            long totalStudents = userRepository.findByRole(User.Role.STUDENT).stream()
                    .filter(s -> {
                        if (t.getCourse() != null && s.getCourses() != null && !s.getCourses().isEmpty()) {
                            if (!s.getCourses().contains(t.getCourse())) return false;
                        }
                        if (t.getSection() != null && s.getSection() != null && !t.getSection().equalsIgnoreCase(s.getSection())) return false;
                        return true;
                    }).count();

            long presentCount = 0;
            if (matchedSession != null) {
                presentCount = attendanceRepository.findBySessionId(matchedSession.getId()).stream()
                        .filter(a -> a.getStatus() == Attendance.Status.PRESENT).count();
            }

            String subName = t.getSubject() != null ? t.getSubject().getName()
                    : (t.getSubjectName() != null ? t.getSubjectName() : t.getCourse().getName());
            String subCode = t.getSubject() != null ? t.getSubject().getCode() : "SUB";
            String progName = t.getCourse() != null ? t.getCourse().getName() : "";
            String deptName = t.getDepartment() != null ? t.getDepartment().getName()
                    : (t.getCourse() != null && t.getCourse().getDepartment() != null ? t.getCourse().getDepartment().getName() : "");

            Integer sem = t.getSemester() != null ? t.getSemester() : 1;
            int yrNum = (sem + 1) / 2;
            String yrName = yrNum == 1 ? "1st Year" : yrNum == 2 ? "2nd Year" : yrNum == 3 ? "3rd Year" : yrNum + "th Year";

            Integer period = t.getPeriod();
            if (period == null && t.getStartTime() != null) {
                int h = t.getStartTime().getHour();
                if (h <= 9) period = 1;
                else if (h == 10) period = 2;
                else if (h == 11) period = 3;
                else if (h >= 13 && h < 14) period = 4;
                else if (h == 14) period = 5;
                else period = 6;
            }

            result.add(AppDTO.FacultyTodayClassDTO.builder()
                    .timetableId(t.getId())
                    .period(period != null ? period : 1)
                    .startTime(t.getStartTime())
                    .endTime(t.getEndTime())
                    .courseId(t.getCourse().getId())
                    .courseName(t.getCourse().getName())
                    .programmeName(progName)
                    .departmentId(t.getDepartment() != null ? t.getDepartment().getId() : null)
                    .departmentName(deptName)
                    .subjectId(t.getSubject() != null ? t.getSubject().getId() : null)
                    .subjectName(subName)
                    .subjectCode(subCode)
                    .semester(t.getSemester())
                    .year(yrName)
                    .section(t.getSection())
                    .classroom(t.getClassroom())
                    .activeSessionId(matchedSession != null ? matchedSession.getId() : null)
                    .sessionCode(matchedSession != null ? matchedSession.getSessionCode() : null)
                    .sessionStatus(matchedSession != null ? matchedSession.getStatus().name() : "NONE")
                    .totalStudents(totalStudents > 0 ? totalStudents : 58)
                    .presentCount(presentCount)
                    .build());
        }
        return result;
    }

    @Override
    @Transactional
    public AppDTO.AttendanceSessionDTO startSessionFromTimetable(Long facultyId, Long timetableId, String sessionType) {
        Timetable t = timetableRepository.findById(timetableId)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable entry not found with ID: " + timetableId));

        if (!t.getFaculty().getId().equals(facultyId)) {
            throw new ConflictException("You are not authorised to start attendance for this class.");
        }

        LocalDate today = LocalDate.now();
        List<AttendanceSession> existing = sessionRepository.findByFacultyIdAndDate(facultyId, today);
        for (AttendanceSession s : existing) {
            boolean matchesSubject = (t.getSubject() != null && s.getSubject() != null && s.getSubject().getId().equals(t.getSubject().getId()))
                    || (t.getSubject() == null && s.getCourse().getId().equals(t.getCourse().getId()));
            if (matchesSubject && s.getSection().equalsIgnoreCase(t.getSection()) && s.getStatus() == AttendanceSession.Status.ACTIVE) {
                return toSessionDTO(s);
            }
        }

        String code = generateUniqueCode();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(15);

        AttendanceSession.SessionType sType = "ONLINE_QR".equalsIgnoreCase(sessionType)
                ? AttendanceSession.SessionType.ONLINE_QR
                : "MANUAL".equalsIgnoreCase(sessionType)
                ? AttendanceSession.SessionType.MANUAL
                : AttendanceSession.SessionType.ONLINE_CODE;

        Department dept = t.getDepartment() != null ? t.getDepartment()
                : (t.getCourse() != null ? t.getCourse().getDepartment() : null);

        Integer period = t.getPeriod();
        if (period == null && t.getStartTime() != null) {
            int h = t.getStartTime().getHour();
            if (h <= 9) period = 1;
            else if (h == 10) period = 2;
            else if (h == 11) period = 3;
            else if (h >= 13 && h < 14) period = 4;
            else if (h == 14) period = 5;
            else period = 6;
        }

        AttendanceSession session = AttendanceSession.builder()
                .sessionCode(code)
                .course(t.getCourse())
                .subject(t.getSubject())
                .faculty(t.getFaculty())
                .department(dept)
                .date(today)
                .period(period != null ? period : 1)
                .startTime(t.getStartTime())
                .endTime(t.getEndTime())
                .room(t.getClassroom())
                .section(t.getSection())
                .semester(t.getSemester())
                .academicYear(t.getAcademicYear() != null ? t.getAcademicYear() : "2025-2026")
                .createdAt(now)
                .expiresAt(expiresAt)
                .status(AttendanceSession.Status.ACTIVE)
                .sessionType(sType)
                .build();

        AttendanceSession saved = sessionRepository.save(session);

        activityLogService.log(t.getFaculty().getEmail(), t.getFaculty().getName(), "FACULTY", "CREATE", "ATTENDANCE",
                "Started attendance session for " + (t.getSubject() != null ? t.getSubject().getName() : t.getCourse().getName()) + " (Sec " + t.getSection() + ") Code: " + code);

        return toSessionDTO(saved);
    }

    @Override
    public List<AppDTO.UserResponse> getSessionStudents(Long sessionId) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        List<User> students = userRepository.findByRole(User.Role.STUDENT).stream()
                .filter(s -> {
                    if (session.getCourse() != null && s.getCourses() != null && !s.getCourses().isEmpty()) {
                        if (!s.getCourses().contains(session.getCourse())) return false;
                    }
                    if (session.getSection() != null && s.getSection() != null && !session.getSection().equalsIgnoreCase(s.getSection())) {
                        return false;
                    }
                    return true;
                })
                .sorted(Comparator.comparing(User::getRollNumber, Comparator.nullsLast(String::compareTo)))
                .toList();

        if (students.isEmpty() && session.getCourse() != null) {
            students = userRepository.findByRole(User.Role.STUDENT).stream()
                    .filter(s -> s.getCourses().contains(session.getCourse()))
                    .toList();
        }

        return students.stream().map(AppDTO.UserResponse::from).collect(Collectors.toList());
    }

    // ================= Session & Online Code Check-in =================

    @Override
    @Transactional
    public AppDTO.AttendanceSessionDTO startAttendanceSession(Long facultyId, Long courseId, String section, String sessionType) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with ID: " + facultyId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + courseId));

        String code = generateUniqueCode();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(15);

        AttendanceSession.SessionType sType = "ONLINE_QR".equalsIgnoreCase(sessionType)
                ? AttendanceSession.SessionType.ONLINE_QR
                : "MANUAL".equalsIgnoreCase(sessionType)
                ? AttendanceSession.SessionType.MANUAL
                : AttendanceSession.SessionType.ONLINE_CODE;

        AttendanceSession session = AttendanceSession.builder()
                .sessionCode(code)
                .faculty(faculty)
                .course(course)
                .department(course.getDepartment())
                .date(LocalDate.now())
                .period(1)
                .section(section != null ? section : "A")
                .semester(course.getSemester())
                .academicYear("2025-2026")
                .createdAt(now)
                .expiresAt(expiresAt)
                .status(AttendanceSession.Status.ACTIVE)
                .sessionType(sType)
                .build();

        AttendanceSession saved = sessionRepository.save(session);
        return toSessionDTO(saved);
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

        // Duplicate Check (Section 11)
        if (attendanceRepository.existsByStudentIdAndSessionId(studentId, session.getId())) {
            throw new ConflictException("Attendance has already been recorded for this session.");
        }

        Course course = session.getCourse();
        if (course == null && session.getFaculty() != null && session.getFaculty().getCourses() != null) {
            course = session.getFaculty().getCourses().stream().findFirst().orElse(null);
        }

        Attendance attendance = Attendance.builder()
                .student(student)
                .course(course)
                .subject(session.getSubject())
                .faculty(session.getFaculty())
                .period(session.getPeriod())
                .section(session.getSection())
                .academicYear(session.getAcademicYear())
                .semester(session.getSemester())
                .session(session)
                .date(session.getDate())
                .status(Attendance.Status.PRESENT)
                .verificationMethod(request.getVerificationMethod() != null ? request.getVerificationMethod() : "ONLINE_CODE")
                .markedAt(LocalDateTime.now())
                .isLocked(false)
                .build();

        Attendance saved = attendanceRepository.save(attendance);

        activityLogService.log(student.getEmail(), student.getName(), "STUDENT", "ATTENDANCE", "ATTENDANCE",
                "Marked Present for " + (session.getSubject() != null ? session.getSubject().getName() : course.getName()) + " via " + attendance.getVerificationMethod());

        return AppDTO.AttendanceResponse.from(saved);
    }

    @Override
    @Transactional
    public void closeAttendanceSession(Long sessionId) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        session.setStatus(AttendanceSession.Status.CLOSED);
        sessionRepository.save(session);

        // Lock all marked attendance records
        List<Attendance> records = attendanceRepository.findBySessionId(sessionId);
        records.forEach(a -> a.setIsLocked(true));
        attendanceRepository.saveAll(records);
    }

    @Override
    public AppDTO.AttendanceSessionDTO getSessionStatus(Long sessionId) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        return toSessionDTO(session);
    }

    // ================= Manual Attendance =================

    @Override
    public List<AppDTO.DepartmentDTO> getFacultyAuthorizedDepartments(Long facultyId) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        List<Department> allDepts = departmentRepository.findAll();
        if (faculty.getRole() == User.Role.ADMIN) {
            return allDepts.stream()
                    .map(d -> AppDTO.DepartmentDTO.builder()
                            .id(d.getId())
                            .code(d.getCode())
                            .name(d.getName())
                            .headOfDepartment(d.getHeadOfDepartment())
                            .status(d.getStatus())
                            .build())
                    .collect(Collectors.toList());
        }

        // For faculty: check assigned department, courses, subjects, and timetables
        Set<String> authKeywords = new HashSet<>();
        if (faculty.getDepartment() != null && !faculty.getDepartment().isBlank()) {
            authKeywords.add(faculty.getDepartment().trim().toLowerCase());
        }

        List<Course> courses = courseRepository.findByFacultyId(facultyId);
        for (Course c : courses) {
            if (c.getDepartment() != null) {
                authKeywords.add(c.getDepartment().getName().toLowerCase());
                authKeywords.add(c.getDepartment().getCode().toLowerCase());
            }
        }

        List<Subject> subjects = subjectRepository.findByFacultyId(facultyId);
        for (Subject s : subjects) {
            if (s.getDepartment() != null) {
                authKeywords.add(s.getDepartment().getName().toLowerCase());
                authKeywords.add(s.getDepartment().getCode().toLowerCase());
            }
        }

        List<Timetable> timetables = timetableRepository.findByFacultyId(facultyId);
        for (Timetable t : timetables) {
            if (t.getDepartment() != null) {
                authKeywords.add(t.getDepartment().getName().toLowerCase());
                authKeywords.add(t.getDepartment().getCode().toLowerCase());
            }
        }

        List<Department> matched = allDepts.stream().filter(d -> {
            String name = d.getName().toLowerCase();
            String code = d.getCode().toLowerCase();
            for (String kw : authKeywords) {
                if (name.contains(kw) || kw.contains(name) || code.equalsIgnoreCase(kw)) {
                    return true;
                }
            }
            return false;
        }).collect(Collectors.toList());

        // Fallback to all departments if faculty is not yet assigned to any specific dept
        if (matched.isEmpty()) {
            matched = allDepts;
        }

        return matched.stream()
                .map(d -> AppDTO.DepartmentDTO.builder()
                        .id(d.getId())
                        .code(d.getCode())
                        .name(d.getName())
                        .headOfDepartment(d.getHeadOfDepartment())
                        .status(d.getStatus())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getFacultyDepartmentSections(Long facultyId, String department) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        validateFacultyAuthorization(faculty, department);

        Set<String> sections = new LinkedHashSet<>();
        String deptLower = (department != null) ? department.toLowerCase() : "";

        if (deptLower.contains("ai") || deptLower.contains("aiml") || deptLower.contains("machine learning")) {
            sections.add("AIML - Sec 1");
            sections.add("AIML - Sec 2");
            sections.add("Sec A");
            sections.add("Sec B");
        } else if (deptLower.contains("computer") || deptLower.contains("cse")) {
            sections.add("Sec A");
            sections.add("Sec B");
            sections.add("CSE - Sec 1");
            sections.add("CSE - Sec 2");
        } else if (deptLower.contains("electronics") || deptLower.contains("ece")) {
            sections.add("Sec A");
            sections.add("Sec B");
            sections.add("ECE - Sec 1");
        } else {
            sections.add("Sec 1");
            sections.add("Sec 2");
            sections.add("Sec A");
            sections.add("Sec B");
        }

        // Also query real sections of students in this department
        List<User> students = userRepository.findByRole(User.Role.STUDENT);
        for (User s : students) {
            if (s.getDepartment() != null && matchesDepartment(s.getDepartment(), department)) {
                if (s.getSection() != null && !s.getSection().isBlank()) {
                    String formatted = formatSectionName(department, s.getSection().trim());
                    sections.add(formatted);
                }
            }
        }

        return new ArrayList<>(sections);
    }

    @Override
    public AppDTO.ManualAttendanceRosterResponse getManualAttendanceRoster(
            Long facultyId, LocalDate date, String department, String section, Long subjectId, Integer period) {

        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        validateFacultyAuthorization(faculty, department);

        LocalDate queryDate = (date != null) ? date : LocalDate.now();

        // 1. Resolve Subject, Subject Code, Period, Timetable for this Faculty + Dept + Section
        Subject assignedSubject = null;
        Course assignedCourse = null;
        Integer resolvedPeriod = period;
        String classroom = "C-204";

        List<Timetable> facultyTt = timetableRepository.findByFacultyId(facultyId);
        Timetable matchedTt = null;

        // Try exact day of week
        Timetable.DayOfWeek dayOfWeek = null;
        try {
            dayOfWeek = Timetable.DayOfWeek.valueOf(queryDate.getDayOfWeek().name());
        } catch (Exception ignored) {}

        if (dayOfWeek != null) {
            final Timetable.DayOfWeek dow = dayOfWeek;
            matchedTt = facultyTt.stream()
                    .filter(t -> t.getDayOfWeek() == dow && matchesSection(t.getSection(), section))
                    .findFirst().orElse(null);
        }

        if (matchedTt == null) {
            matchedTt = facultyTt.stream()
                    .filter(t -> matchesSection(t.getSection(), section))
                    .findFirst().orElse(null);
        }

        if (matchedTt == null && !facultyTt.isEmpty()) {
            matchedTt = facultyTt.get(0);
        }

        if (matchedTt != null) {
            assignedSubject = matchedTt.getSubject();
            assignedCourse = matchedTt.getCourse();
            if (resolvedPeriod == null) resolvedPeriod = matchedTt.getPeriod();
            if (matchedTt.getClassroom() != null) classroom = matchedTt.getClassroom();
        }

        if (subjectId != null) {
            assignedSubject = subjectRepository.findById(subjectId).orElse(assignedSubject);
        } else if (assignedSubject == null) {
            List<Subject> facultySubjects = subjectRepository.findByFacultyId(facultyId);
            if (!facultySubjects.isEmpty()) {
                assignedSubject = facultySubjects.get(0);
            }
        }

        if (assignedCourse == null && assignedSubject != null) {
            assignedCourse = assignedSubject.getCourse();
        }

        if (resolvedPeriod == null) {
            resolvedPeriod = 2; // Default Period 2
        }

        String subName = assignedSubject != null ? assignedSubject.getName()
                : (assignedCourse != null ? assignedCourse.getName() : "Data Structures");
        String subCode = assignedSubject != null ? assignedSubject.getCode()
                : (assignedCourse != null ? assignedCourse.getCode() : "AIML2S2-DSA");
        Long subId = assignedSubject != null ? assignedSubject.getId() : null;
        Long crsId = assignedCourse != null ? assignedCourse.getId() : null;

        // 2. Fetch students for this department and section
        List<User> allStudents = userRepository.findByRole(User.Role.STUDENT);
        List<User> matchedStudents = allStudents.stream()
                .filter(s -> matchesDepartment(s.getDepartment(), department))
                .filter(s -> matchesSection(s.getSection(), section))
                .sorted(Comparator.comparing(User::getRollNumber, Comparator.nullsLast(String::compareTo)))
                .collect(Collectors.toList());

        // Fallback: if section filter yielded 0 students, grab department students
        if (matchedStudents.isEmpty()) {
            matchedStudents = allStudents.stream()
                    .filter(s -> matchesDepartment(s.getDepartment(), department))
                    .sorted(Comparator.comparing(User::getRollNumber, Comparator.nullsLast(String::compareTo)))
                    .collect(Collectors.toList());
        }

        // If still empty and course is known
        if (matchedStudents.isEmpty() && assignedCourse != null) {
            final Course finalCourse = assignedCourse;
            matchedStudents = allStudents.stream()
                    .filter(s -> s.getCourses() != null && s.getCourses().contains(finalCourse))
                    .sorted(Comparator.comparing(User::getRollNumber, Comparator.nullsLast(String::compareTo)))
                    .collect(Collectors.toList());
        }

        // 3. Query existing attendance records for (date, subject/course, period, students)
        boolean hasExisting = false;
        List<AppDTO.StudentRosterItem> rosterItems = new ArrayList<>();
        long presentCount = 0;
        long absentCount = 0;
        long lateCount = 0;
        long excusedCount = 0;

        for (User stu : matchedStudents) {
            Optional<Attendance> existingAtt = Optional.empty();
            if (subId != null) {
                existingAtt = attendanceRepository.findByStudentIdAndSubjectIdAndDateAndPeriod(stu.getId(), subId, queryDate, resolvedPeriod);
            }
            if (existingAtt.isEmpty() && crsId != null) {
                existingAtt = attendanceRepository.findByStudentIdAndCourseIdAndDateAndPeriod(stu.getId(), crsId, queryDate, resolvedPeriod);
            }
            if (existingAtt.isEmpty()) {
                existingAtt = attendanceRepository.findByStudentIdAndDateAndPeriod(stu.getId(), queryDate, resolvedPeriod);
            }

            Attendance.Status st = Attendance.Status.PRESENT;
            String remarks = "";
            Long attId = null;

            if (existingAtt.isPresent()) {
                hasExisting = true;
                Attendance a = existingAtt.get();
                st = a.getStatus();
                remarks = a.getRemarks() != null ? a.getRemarks() : "";
                attId = a.getId();
            }

            if (st == Attendance.Status.PRESENT) presentCount++;
            else if (st == Attendance.Status.ABSENT) absentCount++;
            else if (st == Attendance.Status.LATE) lateCount++;
            else if (st == Attendance.Status.EXCUSED) excusedCount++;

            rosterItems.add(AppDTO.StudentRosterItem.builder()
                    .studentId(stu.getId())
                    .name(stu.getName())
                    .rollNumber(stu.getRollNumber() != null ? stu.getRollNumber() : stu.getStudentId())
                    .department(stu.getDepartment())
                    .section(stu.getSection())
                    .status(st)
                    .remarks(remarks)
                    .attendanceId(attId)
                    .build());
        }

        return AppDTO.ManualAttendanceRosterResponse.builder()
                .date(queryDate)
                .department(department)
                .departmentName(department)
                .section(section)
                .facultyId(faculty.getId())
                .facultyName(faculty.getName())
                .subjectId(subId)
                .subjectName(subName)
                .subjectCode(subCode)
                .period(resolvedPeriod)
                .courseId(crsId)
                .courseName(assignedCourse != null ? assignedCourse.getName() : "")
                .classroom(classroom)
                .isExisting(hasExisting)
                .students(rosterItems)
                .presentCount(presentCount)
                .absentCount(absentCount)
                .lateCount(lateCount)
                .excusedCount(excusedCount)
                .totalCount(rosterItems.size())
                .build();
    }

    @Override
    @Transactional
    public AppDTO.ManualAttendanceRosterResponse saveManualAttendanceRoster(Long facultyId, AppDTO.SaveManualAttendanceRequest request) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        if (request.getDepartment() != null) {
            validateFacultyAuthorization(faculty, request.getDepartment());
        }

        LocalDate date = request.getDate() != null ? request.getDate() : LocalDate.now();
        Integer period = request.getPeriod() != null ? request.getPeriod() : 2;
        Long subjectId = request.getSubjectId();

        Subject subject = null;
        Course course = null;
        if (subjectId != null) {
            subject = subjectRepository.findById(subjectId).orElse(null);
            if (subject != null) {
                course = subject.getCourse();
            }
        }

        if (course == null && faculty.getCourses() != null && !faculty.getCourses().isEmpty()) {
            course = faculty.getCourses().iterator().next();
        }

        if (request.getRecords() == null || request.getRecords().isEmpty()) {
            throw new IllegalArgumentException("No attendance records provided.");
        }

        long presentCount = 0;
        long absentCount = 0;
        long lateCount = 0;
        long excusedCount = 0;
        List<AppDTO.StudentRosterItem> updatedItems = new ArrayList<>();

        for (AppDTO.StudentStatusRecord rec : request.getRecords()) {
            User student = userRepository.findById(rec.getStudentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + rec.getStudentId()));

            // Find existing record to prevent duplicate
            Optional<Attendance> existing = Optional.empty();
            if (subject != null) {
                existing = attendanceRepository.findByStudentIdAndSubjectIdAndDateAndPeriod(student.getId(), subject.getId(), date, period);
            }
            if (existing.isEmpty() && course != null) {
                existing = attendanceRepository.findByStudentIdAndCourseIdAndDateAndPeriod(student.getId(), course.getId(), date, period);
            }
            if (existing.isEmpty()) {
                existing = attendanceRepository.findByStudentIdAndDateAndPeriod(student.getId(), date, period);
            }

            Attendance att;
            Attendance.Status st = rec.getStatus() != null ? rec.getStatus() : Attendance.Status.PRESENT;

            if (existing.isPresent()) {
                att = existing.get();
                att.setStatus(st);
                att.setFaculty(faculty);
                att.setRemarks(rec.getRemarks());
                att.setMarkedAt(LocalDateTime.now());
                att.setVerificationMethod("MANUAL");
                att.setIsLocked(true);
            } else {
                att = Attendance.builder()
                        .student(student)
                        .faculty(faculty)
                        .course(course)
                        .subject(subject)
                        .date(date)
                        .period(period)
                        .section(request.getSection() != null ? request.getSection() : student.getSection())
                        .semester(student.getSemester())
                        .academicYear(student.getAcademicYear() != null ? student.getAcademicYear() : "2025-2026")
                        .status(st)
                        .remarks(rec.getRemarks())
                        .verificationMethod("MANUAL")
                        .markedAt(LocalDateTime.now())
                        .isLocked(true)
                        .build();
            }

            Attendance saved = attendanceRepository.save(att);

            if (st == Attendance.Status.PRESENT) presentCount++;
            else if (st == Attendance.Status.ABSENT) absentCount++;
            else if (st == Attendance.Status.LATE) lateCount++;
            else if (st == Attendance.Status.EXCUSED) excusedCount++;

            updatedItems.add(AppDTO.StudentRosterItem.builder()
                    .studentId(student.getId())
                    .name(student.getName())
                    .rollNumber(student.getRollNumber() != null ? student.getRollNumber() : student.getStudentId())
                    .department(student.getDepartment())
                    .section(student.getSection())
                    .status(st)
                    .remarks(rec.getRemarks())
                    .attendanceId(saved.getId())
                    .build());
        }

        activityLogService.log(faculty.getEmail(), faculty.getName(), "FACULTY", "SAVE", "ATTENDANCE",
                "Saved manual attendance roster for " + updatedItems.size() + " students on " + date + " (Dept: " + request.getDepartment() + ", Sec: " + request.getSection() + ")");

        return AppDTO.ManualAttendanceRosterResponse.builder()
                .date(date)
                .department(request.getDepartment())
                .departmentName(request.getDepartment())
                .section(request.getSection())
                .facultyId(faculty.getId())
                .facultyName(faculty.getName())
                .subjectId(subject != null ? subject.getId() : null)
                .subjectName(subject != null ? subject.getName() : (course != null ? course.getName() : "Data Structures"))
                .subjectCode(subject != null ? subject.getCode() : (course != null ? course.getCode() : "AIML2S2-DSA"))
                .period(period)
                .courseId(course != null ? course.getId() : null)
                .courseName(course != null ? course.getName() : "")
                .isExisting(true)
                .students(updatedItems)
                .presentCount(presentCount)
                .absentCount(absentCount)
                .lateCount(lateCount)
                .excusedCount(excusedCount)
                .totalCount(updatedItems.size())
                .build();
    }

    private void validateFacultyAuthorization(User faculty, String department) {
        if (faculty.getRole() == User.Role.ADMIN) {
            return;
        }
        if (department == null || department.isBlank()) {
            return;
        }
        boolean authorized = false;
        if (faculty.getDepartment() != null && matchesDepartment(faculty.getDepartment(), department)) {
            authorized = true;
        }
        if (!authorized) {
            List<Course> courses = courseRepository.findByFacultyId(faculty.getId());
            for (Course c : courses) {
                if (c.getDepartment() != null && matchesDepartment(c.getDepartment().getName(), department)) {
                    authorized = true;
                    break;
                }
            }
        }
        if (!authorized) {
            List<Subject> subjects = subjectRepository.findByFacultyId(faculty.getId());
            for (Subject s : subjects) {
                if (s.getDepartment() != null && matchesDepartment(s.getDepartment().getName(), department)) {
                    authorized = true;
                    break;
                }
            }
        }
        if (!authorized) {
            List<Timetable> tt = timetableRepository.findByFacultyId(faculty.getId());
            for (Timetable t : tt) {
                String dName = t.getDepartment() != null ? t.getDepartment().getName()
                        : (t.getCourse() != null && t.getCourse().getDepartment() != null ? t.getCourse().getDepartment().getName() : null);
                if (dName != null && matchesDepartment(dName, department)) {
                    authorized = true;
                    break;
                }
            }
        }
        if (!authorized) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Access Denied: You are not authorised to take attendance for department: " + department);
        }
    }

    private boolean matchesDepartment(String dept1, String dept2) {
        if (dept1 == null || dept2 == null) return false;
        String d1 = dept1.trim().toLowerCase();
        String d2 = dept2.trim().toLowerCase();
        if (d1.equalsIgnoreCase(d2) || d1.contains(d2) || d2.contains(d1)) return true;
        if ((d1.contains("ai") || d1.contains("aiml") || d1.contains("machine learning")) &&
            (d2.contains("ai") || d2.contains("aiml") || d2.contains("machine learning"))) return true;
        if ((d1.contains("computer") || d1.contains("cse")) &&
            (d2.contains("computer") || d2.contains("cse"))) return true;
        if ((d1.contains("electronics") || d1.contains("ece")) &&
            (d2.contains("electronics") || d2.contains("ece"))) return true;
        return false;
    }

    private boolean matchesSection(String sec1, String sec2) {
        if (sec1 == null || sec2 == null) return false;
        String s1 = sec1.trim().toLowerCase();
        String s2 = sec2.trim().toLowerCase();
        if (s1.equalsIgnoreCase(s2)) return true;

        String c1 = s1.replaceAll("(?i)(aiml|cse|ece|mech|eee|sec|section|\\s|-)+", "").trim();
        String c2 = s2.replaceAll("(?i)(aiml|cse|ece|mech|eee|sec|section|\\s|-)+", "").trim();
        if (!c1.isEmpty() && !c2.isEmpty()) {
            if (c1.equalsIgnoreCase(c2)) return true;
            if ((c1.equals("1") || c1.equals("a")) && (c2.equals("1") || c2.equals("a"))) return true;
            if ((c1.equals("2") || c1.equals("b")) && (c2.equals("2") || c2.equals("b"))) return true;
            if ((c1.equals("3") || c1.equals("c")) && (c2.equals("3") || c2.equals("c"))) return true;
        }
        return s1.contains(s2) || s2.contains(s1);
    }

    private String formatSectionName(String department, String rawSec) {
        if (rawSec == null || rawSec.isBlank()) return "Sec 1";
        String s = rawSec.trim();
        if (s.contains("-") || s.toLowerCase().startsWith("sec")) return s;
        if (s.equalsIgnoreCase("A")) return "Sec 1";
        if (s.equalsIgnoreCase("B")) return "Sec 2";
        if (s.equalsIgnoreCase("C")) return "Sec 3";
        return "Sec " + s;
    }

    @Override
    @Transactional
    public List<AppDTO.AttendanceResponse> markManualBatch(Long facultyId, Long courseId, LocalDate date, List<AppDTO.AttendanceRequest> records) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

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
                        .faculty(faculty)
                        .date(date)
                        .period(1)
                        .section(student.getSection() != null ? student.getSection() : "A")
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
    @Transactional
    public List<AppDTO.AttendanceResponse> markManualBatchWithSession(Long facultyId, Long sessionId, List<AppDTO.AttendanceRequest> records) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        List<Attendance> results = new ArrayList<>();
        for (AppDTO.AttendanceRequest req : records) {
            User student = userRepository.findById(req.getStudentId()).orElse(null);
            if (student == null) continue;

            Optional<Attendance> existing = attendanceRepository.findByStudentIdAndSessionId(student.getId(), session.getId());
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
                        .course(session.getCourse())
                        .subject(session.getSubject())
                        .faculty(faculty)
                        .session(session)
                        .date(session.getDate())
                        .period(session.getPeriod())
                        .section(session.getSection())
                        .academicYear(session.getAcademicYear())
                        .semester(session.getSemester())
                        .status(req.getStatus() != null ? req.getStatus() : Attendance.Status.PRESENT)
                        .verificationMethod("MANUAL")
                        .markedAt(LocalDateTime.now())
                        .isLocked(true)
                        .build();
            }
            results.add(attendanceRepository.save(att));
        }

        activityLogService.log(faculty.getEmail(), faculty.getName(), "FACULTY", "UPDATE", "ATTENDANCE",
                "Saved manual attendance for " + records.size() + " students in session " + session.getSessionCode());

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

        List<AppDTO.AttendanceSubjectSummaryDTO> subjectBreakdown = getStudentSubjectWiseAttendance(studentId);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalClasses", total);
        summary.put("presentCount", present);
        summary.put("absentCount", absent);
        summary.put("lateCount", late);
        summary.put("excusedCount", excused);
        summary.put("overallPercentage", overallPct);
        summary.put("isShortageAlert", overallPct < 75.0 && total > 0);
        summary.put("subjectBreakdown", subjectBreakdown);
        summary.put("courseBreakdown", subjectBreakdown); // backward compatibility

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

    // ================= Faculty Views =================

    @Override
    public List<AppDTO.AttendanceSessionDTO> getFacultyAttendanceHistory(Long facultyId, Long subjectId, String section, LocalDate fromDate, LocalDate toDate) {
        List<AttendanceSession> sessions = sessionRepository.findByFacultyIdOrderByCreatedAtDesc(facultyId);

        return sessions.stream()
                .filter(s -> subjectId == null || (s.getSubject() != null && s.getSubject().getId().equals(subjectId)))
                .filter(s -> section == null || section.isBlank() || (s.getSection() != null && s.getSection().equalsIgnoreCase(section.trim())))
                .filter(s -> fromDate == null || !s.getDate().isBefore(fromDate))
                .filter(s -> toDate == null || !s.getDate().isAfter(toDate))
                .map(this::toSessionDTO)
                .collect(Collectors.toList());
    }

    @Override
    public AppDTO.AttendanceSubjectSummaryDTO getFacultySubjectSummary(Long facultyId, Long subjectId) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));

        List<Attendance> records = attendanceRepository.findBySubjectId(subjectId);
        long totalClasses = records.stream().map(Attendance::getSession).filter(Objects::nonNull).distinct().count();
        if (totalClasses == 0) {
            totalClasses = records.stream().map(a -> a.getDate().toString() + "_" + a.getPeriod()).distinct().count();
        }

        long present = records.stream().filter(a -> a.getStatus() == Attendance.Status.PRESENT).count();
        long late = records.stream().filter(a -> a.getStatus() == Attendance.Status.LATE).count();
        long totalRecords = records.size();

        double avgPct = totalRecords > 0 ? Math.round(((present + (late * 0.5)) * 100.0 / totalRecords) * 10.0) / 10.0 : 0.0;

        Map<Long, List<Attendance>> byStudent = records.stream().collect(Collectors.groupingBy(a -> a.getStudent().getId()));
        long shortageCount = 0;
        for (List<Attendance> sRecords : byStudent.values()) {
            long sTotal = sRecords.size();
            long sPres = sRecords.stream().filter(a -> a.getStatus() == Attendance.Status.PRESENT).count();
            double sPct = sTotal > 0 ? (sPres * 100.0 / sTotal) : 0;
            if (sPct < 75.0) shortageCount++;
        }

        return AppDTO.AttendanceSubjectSummaryDTO.builder()
                .subjectId(subject.getId())
                .subjectCode(subject.getCode())
                .subjectName(subject.getName())
                .courseId(subject.getCourse() != null ? subject.getCourse().getId() : null)
                .courseName(subject.getCourse() != null ? subject.getCourse().getName() : "")
                .facultyId(facultyId)
                .facultyName(subject.getFaculty() != null ? subject.getFaculty().getName() : "")
                .section(subject.getSection() != null ? subject.getSection() : "A")
                .semester(subject.getSemester())
                .totalClasses(totalClasses)
                .attendedClasses(present)
                .percentage(avgPct)
                .attendancePercentage(avgPct)
                .status(avgPct >= 75.0 ? "Good" : "Shortage")
                .isShortage(avgPct < 75.0)
                .hasShortage(avgPct < 75.0)
                .enrolledStudents((long) byStudent.size())
                .studentsWithShortage(shortageCount)
                .build();
    }

    @Override
    public List<AppDTO.AttendanceSubjectSummaryDTO> getAllFacultySubjectSummaries(Long facultyId) {
        List<Subject> subjects = subjectRepository.findByFacultyId(facultyId);
        List<AppDTO.AttendanceSubjectSummaryDTO> list = new ArrayList<>();
        for (Subject sub : subjects) {
            try {
                list.add(getFacultySubjectSummary(facultyId, sub.getId()));
            } catch (Exception ignored) {}
        }
        if (list.isEmpty()) {
            // Check faculty's timetable subjects if direct assignment is empty
            List<Timetable> ttList = timetableRepository.findByFacultyId(facultyId);
            Set<Long> processedSubIds = new HashSet<>();
            for (Timetable tt : ttList) {
                if (tt.getSubject() != null && processedSubIds.add(tt.getSubject().getId())) {
                    try {
                        list.add(getFacultySubjectSummary(facultyId, tt.getSubject().getId()));
                    } catch (Exception ignored) {}
                }
            }
        }
        return list;
    }

    // ================= Student Dedicated Views =================

    @Override
    public List<AppDTO.AttendanceSubjectSummaryDTO> getStudentSubjectWiseAttendance(Long studentId) {
        List<Attendance> all = attendanceRepository.findByStudentId(studentId);

        Map<String, List<Attendance>> bySubject = all.stream().collect(Collectors.groupingBy(a -> {
            if (a.getSubject() != null) return "SUB_" + a.getSubject().getId();
            if (a.getCourse() != null) return "CRS_" + a.getCourse().getId();
            return "GENERAL";
        }));

        List<AppDTO.AttendanceSubjectSummaryDTO> result = new ArrayList<>();
        for (List<Attendance> sList : bySubject.values()) {
            if (sList.isEmpty()) continue;
            Attendance first = sList.get(0);

            long total = sList.size();
            long present = sList.stream().filter(a -> a.getStatus() == Attendance.Status.PRESENT).count();
            long absent = sList.stream().filter(a -> a.getStatus() == Attendance.Status.ABSENT).count();
            long late = sList.stream().filter(a -> a.getStatus() == Attendance.Status.LATE).count();
            long excused = sList.stream().filter(a -> a.getStatus() == Attendance.Status.EXCUSED).count();

            double pct = total > 0 ? Math.round(((present + (late * 0.5)) * 100.0 / total) * 10.0) / 10.0 : 0.0;

            String subCode = first.getSubject() != null ? first.getSubject().getCode()
                    : (first.getCourse() != null ? first.getCourse().getCode() : "SUB");
            String subName = first.getSubject() != null ? first.getSubject().getName()
                    : (first.getCourse() != null ? first.getCourse().getName() : "Subject");
            String facName = first.getFaculty() != null ? first.getFaculty().getName()
                    : (first.getSession() != null && first.getSession().getFaculty() != null ? first.getSession().getFaculty().getName() : "Faculty Member");

            result.add(AppDTO.AttendanceSubjectSummaryDTO.builder()
                    .subjectId(first.getSubject() != null ? first.getSubject().getId() : null)
                    .subjectCode(subCode)
                    .subjectName(subName)
                    .courseId(first.getCourse() != null ? first.getCourse().getId() : null)
                    .courseName(first.getCourse() != null ? first.getCourse().getName() : "")
                    .facultyName(facName)
                    .section(first.getSection() != null ? first.getSection() : "A")
                    .semester(first.getSemester())
                    .totalClasses(total)
                    .attendedClasses(present)
                    .absentClasses(absent)
                    .lateClasses(late)
                    .excusedClasses(excused)
                    .percentage(pct)
                    .attendancePercentage(pct)
                    .status(pct >= 75.0 ? "Good" : "Shortage")
                    .isShortage(pct < 75.0)
                    .hasShortage(pct < 75.0)
                    .build());
        }

        result.sort(Comparator.comparing(AppDTO.AttendanceSubjectSummaryDTO::getSubjectName));
        return result;
    }

    @Override
    public List<AppDTO.AttendanceResponse> getStudentDateWiseAttendance(Long studentId, LocalDate fromDate, LocalDate toDate, Long subjectId, String status) {
        List<Attendance> all = attendanceRepository.findByStudentId(studentId);

        return all.stream()
                .filter(a -> fromDate == null || !a.getDate().isBefore(fromDate))
                .filter(a -> toDate == null || !a.getDate().isAfter(toDate))
                .filter(a -> subjectId == null || (a.getSubject() != null && a.getSubject().getId().equals(subjectId)) || (a.getCourse() != null && a.getCourse().getId().equals(subjectId)))
                .filter(a -> status == null || status.isBlank() || "ALL".equalsIgnoreCase(status) || a.getStatus().name().equalsIgnoreCase(status))
                .sorted(Comparator.comparing(Attendance::getDate).reversed()
                        .thenComparing(a -> a.getPeriod() != null ? a.getPeriod() : 1, Comparator.reverseOrder()))
                .map(AppDTO.AttendanceResponse::from)
                .collect(Collectors.toList());
    }

    // ================= Admin Reports & Authority =================

    @Override
    public Map<String, Object> getAdminAttendanceOverview(Long departmentId, Long courseId, Integer semester, String section, Long subjectId, LocalDate fromDate, LocalDate toDate) {
        List<Attendance> records = attendanceRepository.findAll().stream()
                .filter(a -> departmentId == null || (a.getCourse() != null && a.getCourse().getDepartment() != null && a.getCourse().getDepartment().getId().equals(departmentId)))
                .filter(a -> courseId == null || (a.getCourse() != null && a.getCourse().getId().equals(courseId)))
                .filter(a -> semester == null || (a.getStudent() != null && semester.equals(a.getStudent().getSemester())))
                .filter(a -> section == null || section.isBlank() || (a.getSection() != null && a.getSection().equalsIgnoreCase(section.trim())))
                .filter(a -> subjectId == null || (a.getSubject() != null && a.getSubject().getId().equals(subjectId)))
                .filter(a -> fromDate == null || !a.getDate().isBefore(fromDate))
                .filter(a -> toDate == null || !a.getDate().isAfter(toDate))
                .toList();

        long total = records.size();
        long present = records.stream().filter(a -> a.getStatus() == Attendance.Status.PRESENT).count();
        long absent = records.stream().filter(a -> a.getStatus() == Attendance.Status.ABSENT).count();
        long late = records.stream().filter(a -> a.getStatus() == Attendance.Status.LATE).count();
        long excused = records.stream().filter(a -> a.getStatus() == Attendance.Status.EXCUSED).count();
        double pct = total > 0 ? Math.round(((present + (late * 0.5)) * 100.0 / total) * 10.0) / 10.0 : 0.0;

        long sessionsCount = records.stream().map(Attendance::getSession).filter(Objects::nonNull).distinct().count();

        return Map.of(
                "totalRecords", total,
                "sessionsConducted", sessionsCount,
                "presentCount", present,
                "absentCount", absent,
                "lateCount", late,
                "excusedCount", excused,
                "averagePercentage", pct
        );
    }

    @Override
    public List<AppDTO.ShortageStudentDTO> getAdminShortageReport(Double thresholdPct, Long departmentId, Long courseId, Integer semester, String section) {
        double threshold = (thresholdPct != null && thresholdPct > 0) ? thresholdPct : 75.0;

        List<User> students = userRepository.findByRole(User.Role.STUDENT).stream()
                .filter(s -> courseId == null || (s.getCourses() != null && s.getCourses().stream().anyMatch(c -> c.getId().equals(courseId))))
                .filter(s -> semester == null || semester.equals(s.getSemester()))
                .filter(s -> section == null || section.isBlank() || (s.getSection() != null && s.getSection().equalsIgnoreCase(section.trim())))
                .toList();

        List<AppDTO.ShortageStudentDTO> shortages = new ArrayList<>();
        for (User student : students) {
            List<AppDTO.AttendanceSubjectSummaryDTO> summaries = getStudentSubjectWiseAttendance(student.getId());
            for (AppDTO.AttendanceSubjectSummaryDTO sub : summaries) {
                if (sub.getPercentage() < threshold && sub.getTotalClasses() > 0) {
                    shortages.add(AppDTO.ShortageStudentDTO.builder()
                            .studentId(student.getId())
                            .studentName(student.getName())
                            .rollNumber(student.getRollNumber())
                            .department(student.getDepartment())
                            .programme(student.getBranch() != null ? student.getBranch() : "B.Tech")
                            .semester(student.getSemester())
                            .section(student.getSection())
                            .subjectId(sub.getSubjectId())
                            .subjectCode(sub.getSubjectCode())
                            .subjectName(sub.getSubjectName())
                            .totalClasses(sub.getTotalClasses())
                            .presentClasses(sub.getAttendedClasses())
                            .percentage(sub.getPercentage())
                            .build());
                }
            }
        }
        return shortages;
    }

    @Override
    @Transactional
    public AppDTO.AttendanceResponse adminManualCorrection(Long attendanceId, String newStatus, String reason, Long adminId) {
        Attendance a = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        String oldStatus = a.getStatus().name();
        a.setStatus(Attendance.Status.valueOf(newStatus.toUpperCase()));
        a.setVerificationMethod("CORRECTED_BY_ADMIN");
        a.setRemarks(reason);
        Attendance saved = attendanceRepository.save(a);

        activityLogService.log(admin.getEmail(), admin.getName(), "ADMIN", "ATTENDANCE", "ATTENDANCE",
                "attendance", String.valueOf(a.getId()), oldStatus, newStatus,
                "Admin correction for student " + a.getStudent().getName() + " (" + a.getStudent().getRollNumber() + "): " + reason);

        return AppDTO.AttendanceResponse.from(saved);
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

        activityLogService.log(student.getEmail(), student.getName(), "STUDENT", "CREATE", "ATTENDANCE",
                "Submitted attendance correction request for date " + saved.getAttendanceDate());

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
            Optional<Attendance> attOpt = attendanceRepository.findByStudentIdAndCourseIdAndDate(
                    corr.getStudent().getId(), corr.getCourse().getId(), corr.getAttendanceDate());

            if (attOpt.isPresent()) {
                Attendance att = attOpt.get();
                att.setStatus(Attendance.Status.valueOf(corr.getRequestedStatus().toUpperCase()));
                att.setVerificationMethod("CORRECTED_BY_FACULTY");
                att.setRemarks(remarks);
                attendanceRepository.save(att);
            } else {
                Attendance att = Attendance.builder()
                        .student(corr.getStudent())
                        .course(corr.getCourse())
                        .faculty(faculty)
                        .date(corr.getAttendanceDate())
                        .period(1)
                        .section(corr.getStudent().getSection() != null ? corr.getStudent().getSection() : "A")
                        .status(Attendance.Status.valueOf(corr.getRequestedStatus().toUpperCase()))
                        .verificationMethod("CORRECTED_BY_FACULTY")
                        .remarks(remarks)
                        .markedAt(LocalDateTime.now())
                        .build();
                attendanceRepository.save(att);
            }
        }

        AttendanceCorrection saved = correctionRepository.save(corr);

        activityLogService.log(faculty.getEmail(), faculty.getName(), "FACULTY", "UPDATE", "ATTENDANCE",
                (approve ? "Approved" : "Rejected") + " attendance correction request #" + saved.getId() + " for " + corr.getStudent().getName());

        return AppDTO.AttendanceCorrectionDTO.builder()
                .id(saved.getId())
                .status(saved.getStatus().name())
                .remarks(saved.getRemarks())
                .reviewedAt(saved.getReviewedAt())
                .reviewedByName(faculty.getName())
                .build();
    }
}
