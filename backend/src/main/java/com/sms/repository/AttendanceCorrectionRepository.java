package com.sms.repository;

import com.sms.entity.AttendanceCorrection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AttendanceCorrectionRepository extends JpaRepository<AttendanceCorrection, Long> {
    List<AttendanceCorrection> findByStudentId(Long studentId);
    List<AttendanceCorrection> findByStatus(AttendanceCorrection.Status status);
    List<AttendanceCorrection> findByCourseId(Long courseId);
}
