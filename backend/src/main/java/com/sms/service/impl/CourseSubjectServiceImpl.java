package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.Course;
import com.sms.entity.Department;
import com.sms.entity.Subject;
import com.sms.entity.User;
import com.sms.exception.ConflictException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CourseRepository;
import com.sms.repository.DepartmentRepository;
import com.sms.repository.SubjectRepository;
import com.sms.repository.UserRepository;
import com.sms.service.CourseSubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.LinkedHashSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseSubjectServiceImpl implements CourseSubjectService {

    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    // ================= Courses =================

    @Override
    public List<AppDTO.CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(AppDTO.CourseResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public AppDTO.CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));
        return AppDTO.CourseResponse.from(course);
    }

    @Override
    @Transactional
    public AppDTO.CourseResponse createCourse(AppDTO.CourseRequest request) {
        if (courseRepository.existsByCode(request.getCode().trim().toUpperCase())) {
            throw new ConflictException("Course code already exists: " + request.getCode());
        }

        Department dept = null;
        if (request.getDepartmentId() != null) {
            dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
        }

        User faculty = null;
        if (request.getFacultyId() != null) {
            faculty = userRepository.findById(request.getFacultyId()).orElse(null);
        }

        Course course = Course.builder()
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName())
                .description(request.getDescription())
                .credits(request.getCredits() != null ? request.getCredits() : 4)
                .semester(request.getSemester() != null ? request.getSemester() : 1)
                .duration(request.getDuration() != null ? request.getDuration() : "4 Years")
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .department(dept)
                .faculty(faculty)
                .build();

        return AppDTO.CourseResponse.from(courseRepository.save(course));
    }

    @Override
    @Transactional
    public AppDTO.CourseResponse updateCourse(Long id, AppDTO.CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));

        if (request.getName() != null) course.setName(request.getName());
        if (request.getDescription() != null) course.setDescription(request.getDescription());
        if (request.getCredits() != null) course.setCredits(request.getCredits());
        if (request.getSemester() != null) course.setSemester(request.getSemester());
        if (request.getDuration() != null) course.setDuration(request.getDuration());
        if (request.getStatus() != null) course.setStatus(request.getStatus());

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
            course.setDepartment(dept);
        }
        if (request.getFacultyId() != null) {
            User faculty = userRepository.findById(request.getFacultyId()).orElse(null);
            course.setFaculty(faculty);
        }

        return AppDTO.CourseResponse.from(courseRepository.save(course));
    }

    @Override
    @Transactional
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));
        courseRepository.delete(course);
    }

    @Override
    public List<AppDTO.CourseResponse> getCoursesByFaculty(Long facultyId) {
        Set<Course> courses = new LinkedHashSet<>(courseRepository.findByFacultyId(facultyId));
        subjectRepository.findByFacultyId(facultyId).forEach(s -> {
            if (s.getCourse() != null) courses.add(s.getCourse());
        });
        if (courses.isEmpty()) {
            userRepository.findById(facultyId).ifPresent(u -> {
                if (u.getCourses() != null && !u.getCourses().isEmpty()) {
                    courses.addAll(u.getCourses());
                }
            });
        }
        if (courses.isEmpty()) {
            courses.addAll(courseRepository.findAll());
        }
        return courses.stream()
                .map(AppDTO.CourseResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.CourseResponse> getCoursesByStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));
        Set<Course> courses = new LinkedHashSet<>(student.getCourses());
        if (courses.isEmpty()) {
            courses.addAll(courseRepository.findAll());
        }
        return courses.stream()
                .map(AppDTO.CourseResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void enrollStudent(Long studentId, Long courseId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + courseId));
        student.getCourses().add(course);
        userRepository.save(student);
    }

    // ================= Subjects =================

    @Override
    public List<AppDTO.SubjectDTO> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(AppDTO.SubjectDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    public AppDTO.SubjectDTO getSubjectById(Long id) {
        Subject s = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with ID: " + id));
        return AppDTO.SubjectDTO.from(s);
    }

    @Override
    @Transactional
    public AppDTO.SubjectDTO createSubject(AppDTO.SubjectDTO request) {
        if (subjectRepository.existsByCode(request.getCode().trim().toUpperCase())) {
            throw new ConflictException("Subject code already exists: " + request.getCode());
        }

        Course course = null;
        if (request.getCourseId() != null) {
            course = courseRepository.findById(request.getCourseId()).orElse(null);
        }

        User faculty = null;
        if (request.getFacultyId() != null) {
            faculty = userRepository.findById(request.getFacultyId()).orElse(null);
        }

        Subject s = Subject.builder()
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName())
                .course(course)
                .semester(request.getSemester() != null ? request.getSemester() : 1)
                .credits(request.getCredits() != null ? request.getCredits() : 3)
                .faculty(faculty)
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        return AppDTO.SubjectDTO.from(subjectRepository.save(s));
    }

    @Override
    @Transactional
    public AppDTO.SubjectDTO updateSubject(Long id, AppDTO.SubjectDTO request) {
        Subject s = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with ID: " + id));

        if (request.getName() != null) s.setName(request.getName());
        if (request.getSemester() != null) s.setSemester(request.getSemester());
        if (request.getCredits() != null) s.setCredits(request.getCredits());
        if (request.getStatus() != null) s.setStatus(request.getStatus());

        if (request.getCourseId() != null) {
            Course course = courseRepository.findById(request.getCourseId()).orElse(null);
            s.setCourse(course);
        }
        if (request.getFacultyId() != null) {
            User faculty = userRepository.findById(request.getFacultyId()).orElse(null);
            s.setFaculty(faculty);
        }

        return AppDTO.SubjectDTO.from(subjectRepository.save(s));
    }

    @Override
    @Transactional
    public void deleteSubject(Long id) {
        Subject s = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with ID: " + id));
        subjectRepository.delete(s);
    }

    @Override
    public List<AppDTO.SubjectDTO> getSubjectsByCourse(Long courseId) {
        return subjectRepository.findByCourseId(courseId).stream()
                .map(AppDTO.SubjectDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.SubjectDTO> getSubjectsByFaculty(Long facultyId) {
        return subjectRepository.findByFacultyId(facultyId).stream()
                .map(AppDTO.SubjectDTO::from)
                .collect(Collectors.toList());
    }
}
