package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.*;
import com.sms.exception.ConflictException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import com.sms.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimetableServiceImpl implements TimetableService {

    private final TimetableRepository timetableRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;

    private AppDTO.TimetableDTO toDTO(Timetable t) {
        String subCode = t.getSubject() != null ? t.getSubject().getCode() : "SUB";
        String progName = t.getCourse() != null ? t.getCourse().getName() : "";
        String deptName = t.getDepartment() != null ? t.getDepartment().getName()
                : (t.getCourse() != null && t.getCourse().getDepartment() != null ? t.getCourse().getDepartment().getName() : "General");
        Long deptId = t.getDepartment() != null ? t.getDepartment().getId()
                : (t.getCourse() != null && t.getCourse().getDepartment() != null ? t.getCourse().getDepartment().getId() : null);
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

        return AppDTO.TimetableDTO.builder()
                .id(t.getId())
                .departmentId(deptId)
                .departmentName(deptName)
                .courseId(t.getCourse().getId())
                .courseName(t.getCourse().getName())
                .programmeName(progName)
                .academicYear(t.getAcademicYear())
                .semester(t.getSemester())
                .year(yrName)
                .section(t.getSection())
                .period(period != null ? period : 1)
                .subjectId(t.getSubject() != null ? t.getSubject().getId() : null)
                .subjectName(t.getSubject() != null ? t.getSubject().getName() : (t.getSubjectName() != null ? t.getSubjectName() : t.getCourse().getName()))
                .subjectCode(subCode)
                .facultyId(t.getFaculty().getId())
                .facultyName(t.getFaculty().getName())
                .dayOfWeek(t.getDayOfWeek().name())
                .startTime(t.getStartTime())
                .endTime(t.getEndTime())
                .classroom(t.getClassroom())
                .status(t.getStatus())
                .build();
    }

    private void validateConflicts(AppDTO.TimetableDTO req, Long currentId) {
        if (req.getStartTime() == null || req.getEndTime() == null) {
            throw new IllegalArgumentException("Start time and end time are required.");
        }
        if (!req.getStartTime().isBefore(req.getEndTime())) {
            throw new ConflictException("Invalid class timings: Start time (" + req.getStartTime() + ") must be before end time (" + req.getEndTime() + ").");
        }

        Timetable.DayOfWeek day = Timetable.DayOfWeek.valueOf(req.getDayOfWeek().toUpperCase());

        // 1. Faculty conflict detection
        List<Timetable> facultyConflicts = timetableRepository.findFacultyConflicts(
                req.getFacultyId(), day, req.getStartTime(), req.getEndTime(), currentId);
        if (!facultyConflicts.isEmpty()) {
            Timetable c = facultyConflicts.get(0);
            throw new ConflictException("Timetable conflict detected: Faculty member (" + c.getFaculty().getName() +
                    ") is already scheduled for " + (c.getSubjectName() != null ? c.getSubjectName() : c.getCourse().getName()) +
                    " in " + c.getClassroom() + " on " + day + " between " + c.getStartTime() + " and " + c.getEndTime() + ". Please select another time slot or faculty.");
        }

        // 2. Classroom conflict detection
        List<Timetable> roomConflicts = timetableRepository.findClassroomConflicts(
                req.getClassroom().trim(), day, req.getStartTime(), req.getEndTime(), currentId);
        if (!roomConflicts.isEmpty()) {
            Timetable c = roomConflicts.get(0);
            throw new ConflictException("Timetable conflict detected: Classroom (" + req.getClassroom() +
                    ") is already occupied for " + (c.getSubjectName() != null ? c.getSubjectName() : c.getCourse().getName()) +
                    " on " + day + " between " + c.getStartTime() + " and " + c.getEndTime() + ". Please select another classroom or time.");
        }

        // 3. Section / Class conflict detection
        List<Timetable> sectionConflicts = timetableRepository.findSectionConflicts(
                req.getCourseId(), req.getSemester(), req.getSection().trim(), day, req.getStartTime(), req.getEndTime(), currentId);
        if (!sectionConflicts.isEmpty()) {
            Timetable c = sectionConflicts.get(0);
            throw new ConflictException("Timetable conflict detected: Section " + req.getSection() +
                    " (Semester " + req.getSemester() + ") already has " + (c.getSubjectName() != null ? c.getSubjectName() : c.getCourse().getName()) +
                    " scheduled on " + day + " between " + c.getStartTime() + " and " + c.getEndTime() + ".");
        }
    }

    @Override
    public List<AppDTO.TimetableDTO> getAllTimetables() {
        return timetableRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.TimetableDTO> getWeeklySchedule(Long courseId, Integer semester, String section) {
        return timetableRepository.findByCourseIdAndSemesterAndSection(courseId, semester, section)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.TimetableDTO> getFacultySchedule(Long facultyId) {
        return timetableRepository.findByFacultyId(facultyId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.TimetableDTO> getStudentSchedule(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        if (student.getSemester() == null) {
            return List.of();
        }

        String sec = (student.getSection() != null && !student.getSection().isBlank()) ? student.getSection() : "A";

        // Find courses for this student
        if (!student.getCourses().isEmpty()) {
            Course c = student.getCourses().iterator().next();
            return timetableRepository.findByCourseIdAndSemesterAndSection(c.getId(), student.getSemester(), sec)
                    .stream().map(this::toDTO).collect(Collectors.toList());
        }

        // Fallback: search all timetables matching student's semester and section
        return timetableRepository.findAll().stream()
                .filter(t -> t.getSemester().equals(student.getSemester()) && t.getSection().equalsIgnoreCase(sec))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppDTO.TimetableDTO createTimetable(AppDTO.TimetableDTO req) {
        validateConflicts(req, null);

        Course course = courseRepository.findById(req.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        User faculty = userRepository.findById(req.getFacultyId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        Department dept = req.getDepartmentId() != null
                ? departmentRepository.findById(req.getDepartmentId()).orElse(null)
                : course.getDepartment();

        Subject subject = req.getSubjectId() != null
                ? subjectRepository.findById(req.getSubjectId()).orElse(null)
                : null;

        String subName = (subject != null) ? subject.getName() : (req.getSubjectName() != null ? req.getSubjectName() : course.getName());

        Timetable t = Timetable.builder()
                .department(dept)
                .course(course)
                .academicYear(req.getAcademicYear() != null ? req.getAcademicYear() : "2025-2026")
                .semester(req.getSemester() != null ? req.getSemester() : course.getSemester())
                .section(req.getSection() != null ? req.getSection().toUpperCase() : "A")
                .period(req.getPeriod())
                .subject(subject)
                .subjectName(subName)
                .faculty(faculty)
                .dayOfWeek(Timetable.DayOfWeek.valueOf(req.getDayOfWeek().toUpperCase()))
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .classroom(req.getClassroom().trim())
                .status("PUBLISHED")
                .build();

        return toDTO(timetableRepository.save(t));
    }

    @Override
    @Transactional
    public AppDTO.TimetableDTO updateTimetable(Long id, AppDTO.TimetableDTO req) {
        Timetable t = timetableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable entry not found"));

        validateConflicts(req, id);

        if (req.getCourseId() != null) {
            Course course = courseRepository.findById(req.getCourseId()).orElse(t.getCourse());
            t.setCourse(course);
        }
        if (req.getFacultyId() != null) {
            User faculty = userRepository.findById(req.getFacultyId()).orElse(t.getFaculty());
            t.setFaculty(faculty);
        }
        if (req.getDayOfWeek() != null) {
            t.setDayOfWeek(Timetable.DayOfWeek.valueOf(req.getDayOfWeek().toUpperCase()));
        }
        if (req.getStartTime() != null) t.setStartTime(req.getStartTime());
        if (req.getEndTime() != null) t.setEndTime(req.getEndTime());
        if (req.getClassroom() != null) t.setClassroom(req.getClassroom().trim());
        if (req.getSection() != null) t.setSection(req.getSection().toUpperCase());
        if (req.getSemester() != null) t.setSemester(req.getSemester());
        if (req.getPeriod() != null) t.setPeriod(req.getPeriod());
        if (req.getSubjectId() != null) {
            Subject s = subjectRepository.findById(req.getSubjectId()).orElse(null);
            t.setSubject(s);
            if (s != null) t.setSubjectName(s.getName());
        } else if (req.getSubjectName() != null) {
            t.setSubjectName(req.getSubjectName());
        }

        return toDTO(timetableRepository.save(t));
    }

    @Override
    @Transactional
    public void deleteTimetable(Long id) {
        Timetable t = timetableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable entry not found"));
        timetableRepository.delete(t);
    }
}
