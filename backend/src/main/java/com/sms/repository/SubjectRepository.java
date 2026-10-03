package com.sms.repository;

import com.sms.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    Optional<Subject> findByCode(String code);
    boolean existsByCode(String code);
    List<Subject> findByCourseId(Long courseId);
    List<Subject> findByFacultyId(Long facultyId);
    List<Subject> findBySemester(Integer semester);
}
