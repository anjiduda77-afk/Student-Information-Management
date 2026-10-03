package com.sms.config;

import com.sms.entity.*;
import com.sms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;
    private final EventRepository eventRepository;
    private final CertificateTemplateRepository certTemplateRepository;
    private final AnnouncementRepository announcementRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.existsByEmail("admin@apex.edu.in")) {
            log.info("Data already initialised. Skipping seed.");
            return;
        }

        log.info("=== Seeding Demo Data for APEX Institute ===");

        // =================== DEPARTMENTS ===================
        Department deptCSE = createDept("CSE", "Computer Science & Engineering", "Dr. Priya Sharma");
        Department deptAIML = createDept("AIML", "Artificial Intelligence & Machine Learning", "Dr. Rajan Mehta");
        Department deptECE = createDept("ECE", "Electronics & Communication Engineering", "Prof. Kavitha Nair");
        Department deptEEE = createDept("EEE", "Electrical & Electronics Engineering", "Dr. Santhosh Kumar");
        Department deptMECH = createDept("MECH", "Mechanical Engineering", "Prof. Arjun Reddy");

        // =================== ADMIN ===================
        User admin = userRepository.save(User.builder()
                .name("System Administrator")
                .email("admin@apex.edu.in")
                .password(passwordEncoder.encode("admin123"))
                .role(User.Role.ADMIN)
                .status("ACTIVE")
                .build());

        // Vijay Admin
        if (!userRepository.existsByEmail("1122@adityauniversity.in")) {
            userRepository.save(User.builder()
                    .name("Vijay")
                    .email("1122@adityauniversity.in")
                    .facultyId("1122")
                    .password(passwordEncoder.encode("aditya1"))
                    .role(User.Role.ADMIN)
                    .status("ACTIVE")
                    .build());
        }

        // =================== FACULTY ===================
        User fPriya = userRepository.save(User.builder()
                .name("Dr. Priya Sharma")
                .email("priya.sharma@apex.edu.in")
                .password(passwordEncoder.encode("faculty123"))
                .role(User.Role.FACULTY)
                .facultyId("FAC-CSE-001")
                .department("Computer Science & Engineering")
                .designation("Associate Professor")
                .mobileNumber("9876543210")
                .status("ACTIVE")
                .build());

        User fRajan = userRepository.save(User.builder()
                .name("Dr. Rajan Mehta")
                .email("rajan.mehta@apex.edu.in")
                .password(passwordEncoder.encode("faculty123"))
                .role(User.Role.FACULTY)
                .facultyId("FAC-AIML-001")
                .department("Artificial Intelligence & Machine Learning")
                .designation("Professor")
                .mobileNumber("9876543211")
                .status("ACTIVE")
                .build());

        User fKavitha = userRepository.save(User.builder()
                .name("Prof. Kavitha Nair")
                .email("kavitha.nair@apex.edu.in")
                .password(passwordEncoder.encode("faculty123"))
                .role(User.Role.FACULTY)
                .facultyId("FAC-ECE-001")
                .department("Electronics & Communication Engineering")
                .designation("Assistant Professor")
                .mobileNumber("9876543212")
                .status("ACTIVE")
                .build());

        // =================== COURSES ===================
        Course btech = courseRepository.save(Course.builder()
                .code("BTECH-CSE")
                .name("B.Tech Computer Science & Engineering")
                .description("4-year undergraduate program in Computer Science and Engineering")
                .credits(160)
                .semester(8)
                .duration("4 Years (8 Semesters)")
                .status("ACTIVE")
                .department(deptCSE)
                .faculty(fPriya)
                .build());

        Course btechAIML = courseRepository.save(Course.builder()
                .code("BTECH-AIML")
                .name("B.Tech AI & Machine Learning")
                .description("4-year undergraduate program specialising in AI, ML and Data Science")
                .credits(160)
                .semester(8)
                .duration("4 Years (8 Semesters)")
                .status("ACTIVE")
                .department(deptAIML)
                .faculty(fRajan)
                .build());

        Course bece = courseRepository.save(Course.builder()
                .code("BTECH-ECE")
                .name("B.Tech Electronics & Communication")
                .description("4-year undergraduate program in Electronics and Communication")
                .credits(160)
                .semester(8)
                .duration("4 Years (8 Semesters)")
                .status("ACTIVE")
                .department(deptECE)
                .faculty(fKavitha)
                .build());

        // =================== SUBJECTS ===================
        Subject dsa = subjectRepository.save(Subject.builder()
                .code("CS301").name("Data Structures & Algorithms")
                .course(btech).semester(3).credits(4).faculty(fPriya).status("ACTIVE").build());

        Subject dbms = subjectRepository.save(Subject.builder()
                .code("CS302").name("Database Management Systems")
                .course(btech).semester(4).credits(4).faculty(fPriya).status("ACTIVE").build());

        Subject os = subjectRepository.save(Subject.builder()
                .code("CS303").name("Operating Systems")
                .course(btech).semester(4).credits(3).faculty(fPriya).status("ACTIVE").build());

        Subject ml = subjectRepository.save(Subject.builder()
                .code("AI301").name("Machine Learning Fundamentals")
                .course(btechAIML).semester(5).credits(4).faculty(fRajan).status("ACTIVE").build());

        Subject networks = subjectRepository.save(Subject.builder()
                .code("EC301").name("Digital Signal Processing")
                .course(bece).semester(5).credits(4).faculty(fKavitha).status("ACTIVE").build());

        // =================== STUDENTS ===================
        User s1 = createStudent("Rahul Gupta", "rahul.gupta@student.apex.edu.in", "STU-2023-001", "CSE2023001", "Computer Science & Engineering", 4, "A", 2023, btech, fPriya);
        User s2 = createStudent("Ananya Krishnan", "ananya.k@student.apex.edu.in", "STU-2023-002", "CSE2023002", "Computer Science & Engineering", 4, "A", 2023, btech, fPriya);
        User s3 = createStudent("Vikram Patel", "vikram.patel@student.apex.edu.in", "STU-2023-003", "AIML2023001", "Artificial Intelligence & Machine Learning", 3, "B", 2023, btechAIML, fRajan);
        User s4 = createStudent("Meera Reddy", "meera.reddy@student.apex.edu.in", "STU-2023-004", "CSE2023003", "Computer Science & Engineering", 2, "A", 2024, btech, fPriya);
        User s5 = createStudent("Arjun Sharma", "arjun.sharma@student.apex.edu.in", "STU-2023-005", "ECE2023001", "Electronics & Communication Engineering", 5, "A", 2022, bece, fKavitha);

        // =================== EVENTS ===================
        Event techfest = eventRepository.save(Event.builder()
                .title("TechNova 2026 – National Techfest")
                .description("APEX Institute's flagship annual National Technical Festival featuring Hackathon, Paper Presentation, Project Expo, Coding Marathon, Robotics Challenge, and Cultural Night. Open to all engineering students across India.")
                .category("Technical")
                .eventDate(LocalDate.now().plusDays(15))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(21, 0))
                .venue("APEX Institute of Technology & Science – Main Campus, Banashankari Stage II, Bengaluru – 560070")
                .organizer("APEX Technical Council & IEEE Student Branch")
                .coordinator(fPriya)
                .maxParticipants(500)
                .registrationDeadline(LocalDateTime.now().plusDays(10))
                .rules("1. Teams must have 2–4 members. 2. Participants must carry original college ID cards. 3. The decision of judges is final and binding.")
                .status(Event.Status.REGISTRATION_OPEN)
                .build());

        Event workshop = eventRepository.save(Event.builder()
                .title("AI & Deep Learning Workshop")
                .description("Intensive 2-day hands-on workshop on Neural Networks, TensorFlow, PyTorch, and real-world AI deployment. Conducted by industry experts from leading tech companies.")
                .category("Workshop")
                .eventDate(LocalDate.now().plusDays(7))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(17, 0))
                .venue("Seminar Hall – Block B, APEX Campus")
                .organizer("Department of AI & Machine Learning")
                .coordinator(fRajan)
                .maxParticipants(80)
                .registrationDeadline(LocalDateTime.now().plusDays(5))
                .rules("1. Participants must bring their own laptops. 2. Python environment setup instructions will be shared via email. 3. Certificate of Participation will be provided to all attendees.")
                .status(Event.Status.REGISTRATION_OPEN)
                .build());

        Event culturalFest = eventRepository.save(Event.builder()
                .title("Srijan 2026 – Annual Cultural Extravaganza")
                .description("Annual inter-college cultural festival featuring Dance, Music, Theatre, Fine Arts, Fashion Show, and Literary events. Celebrate art, culture, and creativity.")
                .category("Cultural")
                .eventDate(LocalDate.now().plusDays(25))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(22, 0))
                .venue("APEX Open Air Theatre & Indoor Auditorium")
                .organizer("Student Cultural Council, APEX")
                .coordinator(fKavitha)
                .maxParticipants(1000)
                .registrationDeadline(LocalDateTime.now().plusDays(20))
                .rules("1. Participants must register individually or as teams based on the event. 2. Respect cultural diversity. 3. Prizes for top 3 positions in each event.")
                .status(Event.Status.REGISTRATION_OPEN)
                .build());

        // =================== CERTIFICATE TEMPLATES ===================
        certTemplateRepository.save(CertificateTemplate.builder()
                .name("Winner Certificate Template")
                .templateType(CertificateTemplate.TemplateType.WINNER)
                .title("CERTIFICATE OF EXCELLENCE")
                .subtitle("THIS IS TO PROUDLY CERTIFY THAT")
                .collegeName("APEX INSTITUTE OF TECHNOLOGY & SCIENCE")
                .borderStyle("CLASSIC_GOLD")
                .primaryColor("#1e3a8a")
                .signatoryTitle("Dean of Academic Affairs & Faculty Convener")
                .signatoryName("Dr. Priya Sharma")
                .bodyTemplate("in recognition of outstanding achievement and securing the coveted {{POSITION}} position in {{EVENT_NAME}}, organised by the Department of {{DEPARTMENT}}, held on {{EVENT_DATE}} at {{VENUE}}, {{COLLEGE_NAME}}.")
                .build());

        certTemplateRepository.save(CertificateTemplate.builder()
                .name("Participation Certificate Template")
                .templateType(CertificateTemplate.TemplateType.PARTICIPATION)
                .title("CERTIFICATE OF PARTICIPATION")
                .subtitle("THIS IS TO CERTIFY THAT")
                .collegeName("APEX INSTITUTE OF TECHNOLOGY & SCIENCE")
                .borderStyle("MODERN_MINIMAL")
                .primaryColor("#4f46e5")
                .signatoryTitle("Head of Department & Convener")
                .signatoryName("Dr. Priya Sharma")
                .bodyTemplate("has successfully participated in {{EVENT_NAME}}, organised by the Department of {{DEPARTMENT}}, held on {{EVENT_DATE}} at {{VENUE}}, {{COLLEGE_NAME}}.")
                .build());

        // =================== ANNOUNCEMENTS ===================
        announcementRepository.save(Announcement.builder()
                .title("Mid-Semester Examinations Schedule – November 2026")
                .content("Mid-semester examinations for all UG programmes will be conducted from 10th November to 20th November 2026. Students are instructed to check their individual timetables on the Student Portal. Hall tickets must be downloaded at least 3 days before the examination.")
                .category("EXAM")
                .priority("HIGH")
                .targetRole("STUDENT")
                .targetDepartment("ALL")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(45))
                .active(true)
                .createdBy(admin)
                .build());

        announcementRepository.save(Announcement.builder()
                .title("Faculty Seminar – Research Methodology & Paper Writing")
                .content("All faculty members are invited to attend the Research Methodology and Technical Paper Writing Seminar scheduled on 5th November 2026 at 11:00 AM in the Faculty Development Centre, Block A. Attendance is mandatory for all permanent faculty.")
                .category("ACADEMIC")
                .priority("NORMAL")
                .targetRole("FACULTY")
                .targetDepartment("ALL")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(20))
                .active(true)
                .createdBy(admin)
                .build());

        announcementRepository.save(Announcement.builder()
                .title("Convocation Ceremony 2026 – Registration Open")
                .content("The 15th Annual Convocation Ceremony for the 2022 Graduating Batch is scheduled for 15th December 2026. Eligible students (2022 pass-outs) are requested to register through the Convocation Portal by 1st December 2026. Gown collection and convocation guidelines will be circulated separately.")
                .category("GENERAL")
                .priority("HIGH")
                .targetRole("ALL")
                .targetDepartment("ALL")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(60))
                .active(true)
                .createdBy(admin)
                .build());

        log.info("=== Demo data seeded successfully! ===");
        log.info("ADMIN    → admin@apex.edu.in          / admin123");
        log.info("FACULTY  → priya.sharma@apex.edu.in   / faculty123");
        log.info("FACULTY  → rajan.mehta@apex.edu.in    / faculty123");
        log.info("STUDENT  → rahul.gupta@student.apex.edu.in / student123");
        log.info("STUDENT  → ananya.k@student.apex.edu.in    / student123");
        log.info("=== You may also log in using Student ID, Roll Number, or Email ===");
    }

    private Department createDept(String code, String name, String hod) {
        return departmentRepository.save(Department.builder()
                .code(code)
                .name(name)
                .headOfDepartment(hod)
                .status("ACTIVE")
                .build());
    }

    private User createStudent(String name, String email, String studentId, String rollNo,
                               String department, int semester, String section, int admYear,
                               Course course, User faculty) {
        User s = userRepository.save(User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode("student123"))
                .role(User.Role.STUDENT)
                .studentId(studentId)
                .rollNumber(rollNo)
                .department(department)
                .branch(department)
                .semester(semester)
                .section(section)
                .admissionYear(admYear)
                .academicYear(admYear + "-" + (admYear + 4))
                .status("ACTIVE")
                .build());

        s.getCourses().add(course);
        return userRepository.save(s);
    }
}
