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

    List<Attendance> findByFacultyId(Long facultyId);
    List<Attendance> findBySubjectId(Long subjectId);
    List<Attendance> findBySubjectIdAndDate(Long subjectId, LocalDate date);
    List<Attendance> findByStudentIdAndDateBetween(Long studentId, LocalDate startDate, LocalDate endDate);
    List<Attendance> findByStudentIdAndSubjectId(Long studentId, Long subjectId);

    Optional<Attendance> findByStudentIdAndCourseIdAndDate(Long studentId, Long courseId, LocalDate date);
    Optional<Attendance> findByStudentIdAndSessionId(Long studentId, Long sessionId);
    Optional<Attendance> findByStudentIdAndSubjectIdAndDateAndPeriod(Long studentId, Long subjectId, LocalDate date, Integer period);
    Optional<Attendance> findByStudentIdAndCourseIdAndDateAndPeriod(Long studentId, Long courseId, LocalDate date, Integer period);
    Optional<Attendance> findByStudentIdAndDateAndPeriod(Long studentId, LocalDate date, Integer period);
    List<Attendance> findBySubjectIdAndDateAndPeriod(Long subjectId, LocalDate date, Integer period);
    List<Attendance> findByDateAndPeriod(LocalDate date, Integer period);

    boolean existsByStudentIdAndCourseIdAndDate(Long studentId, Long courseId, LocalDate date);
    boolean existsByStudentIdAndSessionId(Long studentId, Long sessionId);
    boolean existsByStudentIdAndSubjectIdAndDateAndPeriod(Long studentId, Long subjectId, LocalDate date, Integer period);
    boolean existsByStudentIdAndDateAndPeriod(Long studentId, LocalDate date, Integer period);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.id = :studentId AND a.course.id = :courseId AND a.status = 'PRESENT'")
    Long countPresentByStudentAndCourse(@Param("studentId") Long studentId, @Param("courseId") Long courseId);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.id = :studentId AND a.course.id = :courseId")
    Long countTotalByStudentAndCourse(@Param("studentId") Long studentId, @Param("courseId") Long courseId);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.status = 'PRESENT'")
    Long countAllPresent();

    @Query("SELECT COUNT(a) FROM Attendance a")
    Long countAllAttendance();
}
