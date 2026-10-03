package com.sms.repository;

import com.sms.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);
    List<Attendance> findByStudentIdAndCourseId(Long studentId, Long courseId);
    List<Attendance> findByCourseIdAndDate(Long courseId, LocalDate date);
    List<Attendance> findBySessionId(Long sessionId);

    Optional<Attendance> findByStudentIdAndCourseIdAndDate(Long studentId, Long courseId, LocalDate date);
    Optional<Attendance> findByStudentIdAndSessionId(Long studentId, Long sessionId);

    boolean existsByStudentIdAndCourseIdAndDate(Long studentId, Long courseId, LocalDate date);
    boolean existsByStudentIdAndSessionId(Long studentId, Long sessionId);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.id = :studentId AND a.course.id = :courseId AND a.status = 'PRESENT'")
    Long countPresentByStudentAndCourse(@Param("studentId") Long studentId, @Param("courseId") Long courseId);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.id = :studentId AND a.course.id = :courseId")
    Long countTotalByStudentAndCourse(@Param("studentId") Long studentId, @Param("courseId") Long courseId);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.status = 'PRESENT'")
    Long countAllPresent();

    @Query("SELECT COUNT(a) FROM Attendance a")
    Long countAllAttendance();
}
