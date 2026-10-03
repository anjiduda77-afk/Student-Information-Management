package com.sms.config;

import com.sms.entity.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class EnrichDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final AttendanceRepository attendanceRepository;
    private final MarksRepository marksRepository;
    private final TimetableRepository timetableRepository;
    private final AttendanceCorrectionRepository correctionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking data enrichment for Student and Faculty portals...");

        User student = userRepository.findByEmail("rahul.gupta@student.apex.edu.in").orElse(null);
        User faculty = userRepository.findByEmail("priya.sharma@apex.edu.in").orElse(null);
        Course btech = courseRepository.findByCode("BTECH-CSE").orElse(null);

        if (student == null || faculty == null || btech == null) {
            log.info("Core entities not yet available for enrichment. Skipping.");
            return;
        }

        // 1. Ensure student is enrolled in course
        if (!student.getCourses().contains(btech)) {
            student.getCourses().add(btech);
            userRepository.save(student);
            log.info("Enrolled Rahul Gupta in BTECH-CSE.");
        }

        // 2. Seed Timetable if empty
        if (timetableRepository.count() == 0) {
            List<Subject> subjects = subjectRepository.findByCourseId(btech.getId());
            Subject dsa = subjects.stream().filter(s -> s.getCode().contains("301")).findFirst().orElse(null);
            Subject dbms = subjects.stream().filter(s -> s.getCode().contains("302")).findFirst().orElse(null);
            Subject os = subjects.stream().filter(s -> s.getCode().contains("303")).findFirst().orElse(null);

            timetableRepository.save(Timetable.builder()
                    .course(btech).subject(dsa).subjectName("Data Structures & Algorithms")
                    .faculty(faculty).semester(4).section("A").academicYear("2025-2026")
                    .dayOfWeek(Timetable.DayOfWeek.MONDAY)
                    .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(10, 0))
                    .classroom("LH-101").status("PUBLISHED").build());

            timetableRepository.save(Timetable.builder()
                    .course(btech).subject(dbms).subjectName("Database Management Systems")
                    .faculty(faculty).semester(4).section("A").academicYear("2025-2026")
                    .dayOfWeek(Timetable.DayOfWeek.MONDAY)
                    .startTime(LocalTime.of(11, 0)).endTime(LocalTime.of(12, 0))
                    .classroom("LH-102").status("PUBLISHED").build());

            timetableRepository.save(Timetable.builder()
                    .course(btech).subject(os).subjectName("Operating Systems")
                    .faculty(faculty).semester(4).section("A").academicYear("2025-2026")
                    .dayOfWeek(Timetable.DayOfWeek.TUESDAY)
                    .startTime(LocalTime.of(10, 0)).endTime(LocalTime.of(11, 0))
                    .classroom("LH-103").status("PUBLISHED").build());

            timetableRepository.save(Timetable.builder()
                    .course(btech).subject(dsa).subjectName("Data Structures & Algorithms")
                    .faculty(faculty).semester(4).section("A").academicYear("2025-2026")
                    .dayOfWeek(Timetable.DayOfWeek.WEDNESDAY)
                    .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(10, 0))
                    .classroom("LH-101").status("PUBLISHED").build());

            timetableRepository.save(Timetable.builder()
                    .course(btech).subject(dsa).subjectName("DSA Practical Lab")
                    .faculty(faculty).semester(4).section("A").academicYear("2025-2026")
                    .dayOfWeek(Timetable.DayOfWeek.THURSDAY)
                    .startTime(LocalTime.of(14, 0)).endTime(LocalTime.of(16, 0))
                    .classroom("Computing Lab-2").status("PUBLISHED").build());

            timetableRepository.save(Timetable.builder()
                    .course(btech).subject(dbms).subjectName("Database Systems Lab")
                    .faculty(faculty).semester(4).section("A").academicYear("2025-2026")
                    .dayOfWeek(Timetable.DayOfWeek.FRIDAY)
                    .startTime(LocalTime.of(10, 0)).endTime(LocalTime.of(11, 30))
                    .classroom("LH-102").status("PUBLISHED").build());

            log.info("Seeded 6 Timetable entries.");
        }

        // 3. Seed Marks if empty
        if (marksRepository.count() == 0) {
            marksRepository.save(Marks.builder()
                    .student(student).course(btech)
                    .examType(Marks.ExamType.MIDTERM)
                    .marksObtained(86.0).totalMarks(100.0)
                    .build());

            marksRepository.save(Marks.builder()
                    .student(student).course(btech)
                    .examType(Marks.ExamType.FINAL)
                    .marksObtained(89.0).totalMarks(100.0)
                    .build());

            marksRepository.save(Marks.builder()
                    .student(student).course(btech)
                    .examType(Marks.ExamType.INTERNAL)
                    .marksObtained(36.0).totalMarks(40.0)
                    .build());

            marksRepository.save(Marks.builder()
                    .student(student).course(btech)
                    .examType(Marks.ExamType.ASSIGNMENT)
                    .marksObtained(46.0).totalMarks(50.0)
                    .build());

            marksRepository.save(Marks.builder()
                    .student(student).course(btech)
                    .examType(Marks.ExamType.QUIZ)
                    .marksObtained(19.0).totalMarks(20.0)
                    .build());

            log.info("Seeded 5 Marks records for student Rahul Gupta.");
        }

        // 4. Seed Attendance History if less than 5
        if (attendanceRepository.count() < 5) {
            LocalDate current = LocalDate.now().minusDays(25);
            int count = 0;
            while (count < 18 && !current.isAfter(LocalDate.now().minusDays(1))) {
                if (current.getDayOfWeek() != DayOfWeek.SATURDAY && current.getDayOfWeek() != DayOfWeek.SUNDAY) {
                    Attendance.Status status = Attendance.Status.PRESENT;
                    if (count == 4 || count == 11) status = Attendance.Status.ABSENT;
                    else if (count == 8) status = Attendance.Status.LATE;

                    attendanceRepository.save(Attendance.builder()
                            .student(student)
                            .course(btech)
                            .date(current)
                            .status(status)
                            .verificationMethod(status == Attendance.Status.PRESENT ? "ONLINE_CODE" : "MANUAL")
                            .isLocked(true)
                            .build());
                    count++;
                }
                current = current.plusDays(1);
            }
            log.info("Seeded {} attendance records for Rahul Gupta.", count);
        }

        // 5. Seed a pending correction request if none exists
        if (correctionRepository.count() == 0) {
            correctionRepository.save(AttendanceCorrection.builder()
                    .student(student)
                    .course(btech)
                    .attendanceDate(LocalDate.now().minusDays(4))
                    .previousStatus("ABSENT")
                    .requestedStatus("PRESENT")
                    .reason("Attended college hackathon representing CSE department. Permission slip approved.")
                    .status(AttendanceCorrection.Status.PENDING)
                    .build());
            log.info("Seeded 1 pending attendance correction request.");
        }

        log.info("Data enrichment complete!");
    }
}
