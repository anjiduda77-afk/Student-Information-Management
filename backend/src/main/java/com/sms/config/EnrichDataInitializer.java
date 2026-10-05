package com.sms.config;

import com.sms.entity.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;
    private final AttendanceRepository attendanceRepository;
    private final MarksRepository marksRepository;
    private final TimetableRepository timetableRepository;
    private final AttendanceCorrectionRepository correctionRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking data enrichment for Student, Faculty, and Attendance systems...");

        try {
            jdbcTemplate.execute("ALTER TABLE attendance MODIFY COLUMN status VARCHAR(32) NOT NULL");
        } catch (Exception e) {
            log.debug("Column alter: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("CREATE INDEX idx_att_student_fk ON attendance (student_id)");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("CREATE INDEX idx_att_course_fk ON attendance (course_id)");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE attendance DROP INDEX UK3mjvpj1ab0m02i68nvmeduamb");
            log.info("Successfully dropped obsolete unique constraint UK3mjvpj1ab0m02i68nvmeduamb!");
        } catch (Exception e) {
            log.warn("Index drop UK3mjvpj1ab0m02i68nvmeduamb: {}", e.getMessage());
        }

        User student = userRepository.findByEmail("rahul.gupta@student.apex.edu.in").orElse(null);
        User facultyPriya = userRepository.findByEmail("priya.sharma@apex.edu.in").orElse(null);
        Course btechCSE = courseRepository.findByCode("BTECH-CSE").orElse(null);
        Course btechAIML = courseRepository.findByCode("BTECH-AIML").orElse(null);
        Department deptAIML = departmentRepository.findByCode("AIML").orElse(null);

        // 1. Ensure Aditya University Faculty exist
        User fRamesh = userRepository.findByEmail("ramesh.kumar@adityauniversity.in").orElse(null);
        if (fRamesh == null) {
            fRamesh = userRepository.save(User.builder()
                    .name("Dr. Ramesh Kumar")
                    .email("ramesh.kumar@adityauniversity.in")
                    .facultyId("FAC-AIML-101")
                    .password(passwordEncoder.encode("faculty123"))
                    .role(User.Role.FACULTY)
                    .department("Artificial Intelligence & Machine Learning")
                    .designation("Professor")
                    .status("ACTIVE")
                    .build());
        }

        User fKavya = userRepository.findByEmail("kavya.m@adityauniversity.in").orElse(null);
        if (fKavya == null) {
            fKavya = userRepository.save(User.builder()
                    .name("Dr. Kavya M")
                    .email("kavya.m@adityauniversity.in")
                    .facultyId("FAC-AIML-102")
                    .password(passwordEncoder.encode("faculty123"))
                    .role(User.Role.FACULTY)
                    .department("Artificial Intelligence & Machine Learning")
                    .designation("Associate Professor")
                    .status("ACTIVE")
                    .build());
        }

        User fPrasad = userRepository.findByEmail("prasad.v@adityauniversity.in").orElse(null);
        if (fPrasad == null) {
            fPrasad = userRepository.save(User.builder()
                    .name("Dr. Prasad V")
                    .email("prasad.v@adityauniversity.in")
                    .facultyId("FAC-AIML-103")
                    .password(passwordEncoder.encode("faculty123"))
                    .role(User.Role.FACULTY)
                    .department("Artificial Intelligence & Machine Learning")
                    .designation("Assistant Professor")
                    .status("ACTIVE")
                    .build());
        }

        // 2. Ensure AIML subjects from prompt exist: Probability, Digital Logic & CO, Physics, Data Structures
        if (btechAIML != null) {
            if (subjectRepository.findByCode("AIML2S2-PRB").isEmpty()) {
                subjectRepository.save(Subject.builder()
                        .code("AIML2S2-PRB").name("Probability & Statistics")
                        .course(btechAIML).department(deptAIML).semester(2).credits(4)
                        .year("2nd Year").section("A").academicYear("2025-2026")
                        .faculty(fRamesh).status("ACTIVE").build());
            }
            if (subjectRepository.findByCode("AIML2S2-DLC").isEmpty()) {
                subjectRepository.save(Subject.builder()
                        .code("AIML2S2-DLC").name("Digital Logic & Computer Organization")
                        .course(btechAIML).department(deptAIML).semester(2).credits(4)
                        .year("2nd Year").section("A").academicYear("2025-2026")
                        .faculty(fKavya).status("ACTIVE").build());
            }
            if (subjectRepository.findByCode("AIML2S2-PHY").isEmpty()) {
                subjectRepository.save(Subject.builder()
                        .code("AIML2S2-PHY").name("Applied Physics")
                        .course(btechAIML).department(deptAIML).semester(2).credits(3)
                        .year("2nd Year").section("A").academicYear("2025-2026")
                        .faculty(facultyPriya != null ? facultyPriya : fRamesh).status("ACTIVE").build());
            }
            if (subjectRepository.findByCode("AIML2S2-DSA").isEmpty()) {
                subjectRepository.save(Subject.builder()
                        .code("AIML2S2-DSA").name("Data Structures & Algorithms")
                        .course(btechAIML).department(deptAIML).semester(2).credits(4)
                        .year("2nd Year").section("A").academicYear("2025-2026")
                        .faculty(fPrasad).status("ACTIVE").build());
            }

            // Timetable for Dr. Ramesh on MONDAY Period 1
            Subject subPrb = subjectRepository.findByCode("AIML2S2-PRB").orElse(null);
            if (subPrb != null && timetableRepository.findByFacultyId(fRamesh.getId()).isEmpty()) {
                timetableRepository.save(Timetable.builder()
                        .course(btechAIML).department(deptAIML).subject(subPrb).subjectName(subPrb.getName())
                        .faculty(fRamesh).semester(2).section("A").academicYear("2025-2026").period(1)
                        .dayOfWeek(Timetable.DayOfWeek.MONDAY)
                        .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(10, 0))
                        .classroom("C-204").status("PUBLISHED").build());

                timetableRepository.save(Timetable.builder()
                        .course(btechAIML).department(deptAIML).subject(subPrb).subjectName(subPrb.getName())
                        .faculty(fRamesh).semester(2).section("A").academicYear("2025-2026").period(3)
                        .dayOfWeek(Timetable.DayOfWeek.TUESDAY)
                        .startTime(LocalTime.of(11, 0)).endTime(LocalTime.of(12, 0))
                        .classroom("C-204").status("PUBLISHED").build());
            }

            // Timetable for Dr. Prasad on MONDAY Period 2
            Subject subDsa = subjectRepository.findByCode("AIML2S2-DSA").orElse(null);
            if (subDsa != null && timetableRepository.findByFacultyId(fPrasad.getId()).isEmpty()) {
                timetableRepository.save(Timetable.builder()
                        .course(btechAIML).department(deptAIML).subject(subDsa).subjectName(subDsa.getName())
                        .faculty(fPrasad).semester(2).section("A").academicYear("2025-2026").period(2)
                        .dayOfWeek(Timetable.DayOfWeek.MONDAY)
                        .startTime(LocalTime.of(10, 0)).endTime(LocalTime.of(11, 0))
                        .classroom("C-204").status("PUBLISHED").build());
            }

            // Timetable for Dr. Kavya on MONDAY Period 4
            Subject subDlc = subjectRepository.findByCode("AIML2S2-DLC").orElse(null);
            if (subDlc != null && timetableRepository.findByFacultyId(fKavya.getId()).isEmpty()) {
                timetableRepository.save(Timetable.builder()
                        .course(btechAIML).department(deptAIML).subject(subDlc).subjectName(subDlc.getName())
                        .faculty(fKavya).semester(2).section("A").academicYear("2025-2026").period(4)
                        .dayOfWeek(Timetable.DayOfWeek.MONDAY)
                        .startTime(LocalTime.of(13, 0)).endTime(LocalTime.of(14, 0))
                        .classroom("C-205").status("PUBLISHED").build());
            }
        }

        // 3. Ensure BTECH-CSE timetable entries have periods and subjects linked
        if (btechCSE != null && facultyPriya != null) {
            List<Subject> cseSubjects = subjectRepository.findByCourseId(btechCSE.getId());
            Subject dsa = cseSubjects.stream().filter(s -> s.getCode().contains("301")).findFirst().orElse(null);
            Subject dbms = cseSubjects.stream().filter(s -> s.getCode().contains("302")).findFirst().orElse(null);
            Subject os = cseSubjects.stream().filter(s -> s.getCode().contains("303")).findFirst().orElse(null);

            List<Timetable> priyaTimetable = timetableRepository.findByFacultyId(facultyPriya.getId());
            for (Timetable t : priyaTimetable) {
                if (t.getPeriod() == null) {
                    int h = t.getStartTime() != null ? t.getStartTime().getHour() : 9;
                    if (h <= 9) t.setPeriod(1);
                    else if (h == 10) t.setPeriod(2);
                    else if (h == 11) t.setPeriod(3);
                    else if (h >= 13 && h < 14) t.setPeriod(4);
                    else if (h >= 14 && h < 16) t.setPeriod(5);
                    else t.setPeriod(6);
                }
                if (t.getSubject() == null) {
                    if (t.getSubjectName() != null && t.getSubjectName().contains("Database") && dbms != null) {
                        t.setSubject(dbms);
                    } else if (t.getSubjectName() != null && t.getSubjectName().contains("Operating") && os != null) {
                        t.setSubject(os);
                    } else if (dsa != null) {
                        t.setSubject(dsa);
                    }
                }
                timetableRepository.save(t);
            }

            // 4. Update student attendance records to link to subjects & periods
            if (student != null) {
                List<Attendance> stuAtt = attendanceRepository.findByStudentId(student.getId());
                Subject[] subjPool = { dsa, dbms, os };
                for (int i = 0; i < stuAtt.size(); i++) {
                    Attendance a = stuAtt.get(i);
                    boolean modified = false;
                    if (a.getSubject() == null && subjPool[i % subjPool.length] != null) {
                        a.setSubject(subjPool[i % subjPool.length]);
                        modified = true;
                    }
                    if (a.getFaculty() == null) {
                        a.setFaculty(facultyPriya);
                        modified = true;
                    }
                    if (a.getPeriod() == null) {
                        a.setPeriod((i % 4) + 1);
                        modified = true;
                    }
                    if (a.getSection() == null) {
                        a.setSection(student.getSection() != null ? student.getSection() : "A");
                        modified = true;
                    }
                    if (modified) {
                        attendanceRepository.save(a);
                    }
                }
                log.info("Enriched {} attendance records for student {}", stuAtt.size(), student.getName());
            }
        }

        log.info("Attendance & Timetable data enrichment successfully completed!");
    }
}
