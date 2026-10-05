package com.sms.repository;

import com.sms.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    Optional<AttendanceSession> findBySessionCode(String sessionCode);
    List<AttendanceSession> findByFacultyId(Long facultyId);
    List<AttendanceSession> findByFacultyIdAndDate(Long facultyId, LocalDate date);
    List<AttendanceSession> findByFacultyIdOrderByCreatedAtDesc(Long facultyId);
    List<AttendanceSession> findBySubjectIdAndDate(Long subjectId, LocalDate date);
    List<AttendanceSession> findByStatus(AttendanceSession.Status status);
}
