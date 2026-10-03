package com.sms.service;

import com.sms.dto.AppDTO;
import java.util.List;

public interface CourseSubjectService {
    // Courses
    List<AppDTO.CourseResponse> getAllCourses();
    AppDTO.CourseResponse getCourseById(Long id);
    AppDTO.CourseResponse createCourse(AppDTO.CourseRequest request);
    AppDTO.CourseResponse updateCourse(Long id, AppDTO.CourseRequest request);
    void deleteCourse(Long id);
    List<AppDTO.CourseResponse> getCoursesByFaculty(Long facultyId);
    List<AppDTO.CourseResponse> getCoursesByStudent(Long studentId);
    void enrollStudent(Long studentId, Long courseId);

    // Subjects
    List<AppDTO.SubjectDTO> getAllSubjects();
    AppDTO.SubjectDTO getSubjectById(Long id);
    AppDTO.SubjectDTO createSubject(AppDTO.SubjectDTO request);
    AppDTO.SubjectDTO updateSubject(Long id, AppDTO.SubjectDTO request);
    void deleteSubject(Long id);
    List<AppDTO.SubjectDTO> getSubjectsByCourse(Long courseId);
    List<AppDTO.SubjectDTO> getSubjectsByFaculty(Long facultyId);
}
