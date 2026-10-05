package com.sms.repository;

import com.sms.entity.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalTime;
import java.util.List;

public interface TimetableRepository extends JpaRepository<Timetable, Long> {
    List<Timetable> findByCourseId(Long courseId);
    List<Timetable> findByFacultyId(Long facultyId);
    List<Timetable> findByFacultyIdAndDayOfWeek(Long facultyId, Timetable.DayOfWeek dayOfWeek);
    List<Timetable> findByCourseIdAndSemesterAndSection(Long courseId, Integer semester, String section);
    List<Timetable> findByCourseIdAndSemesterAndSectionAndDayOfWeek(Long courseId, Integer semester, String section, Timetable.DayOfWeek dayOfWeek);
    List<Timetable> findByClassroom(String classroom);

    @Query("SELECT t FROM Timetable t WHERE t.faculty.id = :facultyId AND t.dayOfWeek = :dayOfWeek " +
           "AND (:id IS NULL OR t.id <> :id) " +
           "AND t.startTime < :endTime AND t.endTime > :startTime")
    List<Timetable> findFacultyConflicts(@Param("facultyId") Long facultyId,
                                        @Param("dayOfWeek") Timetable.DayOfWeek dayOfWeek,
                                        @Param("startTime") LocalTime startTime,
                                        @Param("endTime") LocalTime endTime,
                                        @Param("id") Long id);

    @Query("SELECT t FROM Timetable t WHERE t.classroom = :classroom AND t.dayOfWeek = :dayOfWeek " +
           "AND (:id IS NULL OR t.id <> :id) " +
           "AND t.startTime < :endTime AND t.endTime > :startTime")
    List<Timetable> findClassroomConflicts(@Param("classroom") String classroom,
                                          @Param("dayOfWeek") Timetable.DayOfWeek dayOfWeek,
                                          @Param("startTime") LocalTime startTime,
                                          @Param("endTime") LocalTime endTime,
                                          @Param("id") Long id);

    @Query("SELECT t FROM Timetable t WHERE t.course.id = :courseId AND t.semester = :semester " +
           "AND t.section = :section AND t.dayOfWeek = :dayOfWeek " +
           "AND (:id IS NULL OR t.id <> :id) " +
           "AND t.startTime < :endTime AND t.endTime > :startTime")
    List<Timetable> findSectionConflicts(@Param("courseId") Long courseId,
                                        @Param("semester") Integer semester,
                                        @Param("section") String section,
                                        @Param("dayOfWeek") Timetable.DayOfWeek dayOfWeek,
                                        @Param("startTime") LocalTime startTime,
                                        @Param("endTime") LocalTime endTime,
                                        @Param("id") Long id);
}
