package com.sms.repository;

import com.sms.entity.AcademicSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicSectionRepository extends JpaRepository<AcademicSection, Long> {
    Optional<AcademicSection> findByCode(String code);
    boolean existsByCode(String code);

    @Query("SELECT s FROM AcademicSection s WHERE " +
           "(:departmentId IS NULL OR (s.department IS NOT NULL AND s.department.id = :departmentId)) AND " +
           "(:semester IS NULL OR s.semester = :semester) AND " +
           "(:academicYear IS NULL OR s.academicYear = :academicYear) " +
           "ORDER BY s.department.name ASC, s.semester ASC, s.sectionName ASC")
    List<AcademicSection> findByFilters(
            @Param("departmentId") Long departmentId,
            @Param("semester") Integer semester,
            @Param("academicYear") String academicYear
    );
}
