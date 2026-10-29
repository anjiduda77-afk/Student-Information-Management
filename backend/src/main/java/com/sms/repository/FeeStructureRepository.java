package com.sms.repository;

import com.sms.entity.FeeStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeeStructureRepository extends JpaRepository<FeeStructure, Long> {

    List<FeeStructure> findByStatus(FeeStructure.Status status);

    List<FeeStructure> findByAcademicYear(String academicYear);

    List<FeeStructure> findByAcademicYearAndStatus(String academicYear, FeeStructure.Status status);

    List<FeeStructure> findByDepartmentAndAcademicYearAndStatus(
            String department, String academicYear, FeeStructure.Status status);

    List<FeeStructure> findBySemesterAndAcademicYearAndStatus(
            Integer semester, String academicYear, FeeStructure.Status status);
}
