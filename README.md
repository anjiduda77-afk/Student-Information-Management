# 🎓 Smart Student Information System

<p align="center">

  <img src="https://img.shields.io/badge/Aditya%20University-Smart%20Student%20Information%20System-0B1F3A?style=for-the-badge" alt="Aditya University">

  <img src="https://img.shields.io/badge/Java-Spring%20Boot-orange?style=for-the-badge&logo=springboot" alt="Spring Boot">

  <img src="https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react" alt="React">

  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql" alt="MySQL">

</p>

<p align="center">
  <strong>A professional university management platform for Students, Faculty and Administration.</strong>
</p>

<p align="center">
  <a href="https://github.com/anjiduda77-afk/Student-Information-Management">
    View Repository
  </a>
</p>

---

## 📌 Project Overview

**Smart Student Information System (SIS)** is a web-based university information management application developed for **Aditya University**.

The system provides a centralised platform for managing student information, faculty activities, academic records, attendance, marks, timetable, events, registrations, certificates and other university-related operations.

The application follows a **role-based access model**, providing different functionality for:

- 👨‍💼 Admin
- 👨‍🏫 Faculty
- 🎓 Student

The main objective is to provide a structured, secure and user-friendly platform for university administration and academic activities.

---

## 🎯 Objectives

The major objectives of the Smart Student Information System are:

- Centralise student and faculty information.
- Manage academic information in an organised manner.
- Provide role-based access to different users.
- Maintain student attendance records.
- Manage marks and academic performance.
- Provide timetable information.
- Manage university events and registrations.
- Manage event results and certificates.
- Provide students with access to their academic information.
- Reduce manual administrative work.
- Provide a professional and responsive university management interface.

---

## ✨ Key Features

### 🔐 Authentication & Role-Based Access

- Secure user authentication.
- Role-based access for Admin, Faculty and Student.
- Protected application routes.
- Separate dashboards based on user role.
- Role-based access control for academic and administrative operations.

### 👨‍💼 Admin Management

The Admin module provides institution-level management capabilities including:

- Student management
- Faculty management
- Academic management
- Attendance monitoring
- Marks and grades management
- Timetable management
- Event management
- Faculty event coordinator assignment
- Certificate management
- Notifications and announcements
- Reports and administrative controls
- Profile management
- System settings

### 👨‍🏫 Faculty Management

Faculty members can access the academic and event operations assigned to them.

Features include:

- Faculty profile
- Assigned subjects
- Timetable
- Attendance management
- Marks and grades
- Assigned event management
- Event participant management
- Event result management
- Certificate generation for assigned events
- Notifications
- Reports

### 🎓 Student Portal

Students can access their own academic and university information.

Features include:

- Student dashboard
- Student profile
- Attendance overview
- Subject-wise attendance
- Date-wise attendance
- Attendance history
- Marks and grades
- Timetable
- University events
- Event registration
- Event details
- My Certificates
- Certificate viewing
- Certificate downloading
- Notifications

---

# 🧩 Main Modules

| Module | Description |
|---|---|
| 🔐 Authentication | Secure login and role-based access |
| 👨‍🎓 Student Management | Manage student information and academic details |
| 👨‍🏫 Faculty Management | Manage faculty information and assigned academic activities |
| 📚 Academic Management | Manage departments, programmes, subjects and academic information |
| 📝 Attendance | Record and monitor student attendance |
| 📊 Marks & Grades | Manage and view academic performance |
| 🗓️ Timetable | Manage and display academic schedules |
| 🎉 Event Management | Create, manage and publish university events |
| 🏆 Event Results | Manage event outcomes and participant results |
| 📜 Certificate Management | Generate and manage event certificates |
| 🔔 Notifications | Display relevant university notifications |
| 📈 Reports | Provide academic and administrative information |
| 👤 Profile Management | Manage student, faculty and admin profiles |

---

# 🎉 Event Management

The Event Management module provides a complete workflow for university events.

### Admin Workflow

```text
Admin Login
     ↓
Create Event
     ↓
Add Event Details
     ↓
Upload Event Poster
     ↓
Add Rules & Eligibility
     ↓
Set Date / Time / Venue
     ↓
Publish Event
     ↓
Assign Faculty Coordinator
```
## 🏗️ System Architecture

The Smart Student Information System follows a layered architecture that
connects the React + Vite frontend with the Spring Boot backend and MySQL
database. The system provides separate access and functionality for Admin,
Faculty and Student users, along with public certificate verification.

```mermaid
flowchart TB

    %% =========================
    %% USERS
    %% =========================

    ADMIN["👨‍💼 ADMIN"]
    FACULTY["👨‍🏫 FACULTY"]
    STUDENT["🎓 STUDENT"]
    PUBLIC["🌐 PUBLIC USER<br/>Certificate Verification"]

    %% =========================
    %% FRONTEND
    %% =========================

    subgraph FRONTEND["💻 PRESENTATION LAYER — REACT + VITE"]

        LOGIN["🔐 Login & Authentication"]

        ADMIN_UI["🛠️ Admin Portal"]
        FACULTY_UI["👨‍🏫 Faculty Portal"]
        STUDENT_UI["🎓 Student Portal"]

        PROFILE_UI["👤 Profile Management"]
        DASHBOARD["📊 Dashboards"]

        STUDENT_MODULES["🎓 Student Features<br/>
        • Profile<br/>
        • Attendance<br/>
        • Marks & Grades<br/>
        • Timetable<br/>
        • Events<br/>
        • Certificates<br/>
        • Notifications"]

        FACULTY_MODULES["👨‍🏫 Faculty Features<br/>
        • Profile<br/>
        • Classes<br/>
        • Attendance<br/>
        • Marks & Grades<br/>
        • Timetable<br/>
        • Events<br/>
        • Participants<br/>
        • Certificates"]

        ADMIN_MODULES["🛠️ Admin Features<br/>
        • Users<br/>
        • Students<br/>
        • Faculty<br/>
        • Departments<br/>
        • Courses<br/>
        • Subjects<br/>
        • Attendance<br/>
        • Timetable<br/>
        • Events<br/>
        • Certificates<br/>
        • Notifications<br/>
        • Reports<br/>
        • Settings<br/>
        • Activity Logs"]

        PUBLIC_VERIFY["📜 Public Certificate<br/>Verification Page"]

        STUDENT_UI --> STUDENT_MODULES
        FACULTY_UI --> FACULTY_MODULES
        ADMIN_UI --> ADMIN_MODULES
    end

    ADMIN --> LOGIN
    FACULTY --> LOGIN
    STUDENT --> LOGIN
    PUBLIC --> PUBLIC_VERIFY

    LOGIN --> DASHBOARD
    LOGIN --> PROFILE_UI

    %% =========================
    %% API / SECURITY
    %% =========================

    subgraph API_LAYER["🌐 APPLICATION & API LAYER — SPRING BOOT"]

        API["REST API<br/>Spring Boot Controllers"]

        AUTH["🔐 Authentication & Authorization<br/>
        JWT • BCrypt • RBAC"]

        VALIDATION["✅ Validation Layer<br/>
        Request Validation"]

        EXCEPTION["⚠️ Global Exception Handling"]

        AOP["🔎 AOP / Audit Logging"]

        API --> AUTH
        AUTH --> VALIDATION
        VALIDATION --> EXCEPTION
        EXCEPTION --> AOP
    end

    FRONTEND -->|"HTTP / REST + JSON"| API
    PUBLIC_VERIFY -->|"Public Verification Request"| API

    %% =========================
    %% SERVICE LAYER
    %% =========================

    subgraph SERVICE_LAYER["⚙️ BUSINESS LOGIC LAYER — SERVICE LAYER"]

        USER_SERVICE["👥 User & Role Service"]
        STUDENT_SERVICE["🎓 Student Service"]
        FACULTY_SERVICE["👨‍🏫 Faculty Service"]

        ACADEMIC_SERVICE["🏫 Academic Management Service"]

        ATTENDANCE_SERVICE["📋 Attendance Service"]
        MARKS_SERVICE["📝 Marks & Grades Service"]
        TIMETABLE_SERVICE["🗓️ Timetable Service"]

        EVENT_SERVICE["🎪 Event Management Service"]
        CERT_SERVICE["🏆 Certificate Service"]

        NOTIFICATION_SERVICE["🔔 Notification Service"]
        REPORT_SERVICE["📊 Reports Service"]

        PROFILE_SERVICE["👤 Profile Service"]
        SETTINGS_SERVICE["⚙️ System Settings Service"]

        VERIFICATION_SERVICE["🔎 Certificate Verification Service"]
    end

    AOP --> USER_SERVICE
    AOP --> STUDENT_SERVICE
    AOP --> FACULTY_SERVICE
    AOP --> ACADEMIC_SERVICE
    AOP --> ATTENDANCE_SERVICE
    AOP --> MARKS_SERVICE
    AOP --> TIMETABLE_SERVICE
    AOP --> EVENT_SERVICE
    AOP --> CERT_SERVICE
    AOP --> NOTIFICATION_SERVICE
    AOP --> REPORT_SERVICE
    AOP --> PROFILE_SERVICE
    AOP --> SETTINGS_SERVICE
    AOP --> VERIFICATION_SERVICE

    %% =========================
    %% REPOSITORY LAYER
    %% =========================

    subgraph REPOSITORY_LAYER["🗄️ DATA ACCESS LAYER — SPRING DATA JPA"]

        USER_REPO["UserRepository"]
        STUDENT_REPO["StudentRepository"]
        FACULTY_REPO["FacultyRepository"]

        DEPARTMENT_REPO["DepartmentRepository"]
        COURSE_REPO["CourseRepository"]
        SUBJECT_REPO["SubjectRepository"]

        ATTENDANCE_REPO["AttendanceRepository"]
        MARKS_REPO["MarksRepository"]
        TIMETABLE_REPO["TimetableRepository"]

        EVENT_REPO["EventRepository"]
        PARTICIPANT_REPO["ParticipantRepository"]

        CERT_REPO["CertificateRepository"]
        TEMPLATE_REPO["CertificateTemplateRepository"]

        NOTIFICATION_REPO["NotificationRepository"]
        REPORT_REPO["ReportRepository"]

        AUDIT_REPO["AuditLogRepository"]
    end

    USER_SERVICE --> USER_REPO
    STUDENT_SERVICE --> STUDENT_REPO
    FACULTY_SERVICE --> FACULTY_REPO

    ACADEMIC_SERVICE --> DEPARTMENT_REPO
    ACADEMIC_SERVICE --> COURSE_REPO
    ACADEMIC_SERVICE --> SUBJECT_REPO

    ATTENDANCE_SERVICE --> ATTENDANCE_REPO
    MARKS_SERVICE --> MARKS_REPO
    TIMETABLE_SERVICE --> TIMETABLE_REPO

    EVENT_SERVICE --> EVENT_REPO
    EVENT_SERVICE --> PARTICIPANT_REPO

    CERT_SERVICE --> CERT_REPO
    CERT_SERVICE --> TEMPLATE_REPO

    NOTIFICATION_SERVICE --> NOTIFICATION_REPO
    REPORT_SERVICE --> REPORT_REPO

    AOP --> AUDIT_REPO
    VERIFICATION_SERVICE --> CERT_REPO

    %% =========================
    %% MYSQL DATABASE
    %% =========================

    subgraph DATABASE["🐬 MYSQL DATABASE — student_information_system"]

        DB_USERS[("users")]
        DB_STUDENTS[("students")]
        DB_FACULTY[("faculty")]

        DB_DEPARTMENTS[("departments")]
        DB_COURSES[("courses")]
        DB_SUBJECTS[("subjects")]

        DB_ATTENDANCE[("attendance_sessions<br/>attendance_records")]
        DB_MARKS[("marks / grades")]
        DB_TIMETABLE[("timetable")]

        DB_EVENTS[("events")]
        DB_PARTICIPANTS[("event_participants")]

        DB_CERTIFICATES[("certificates")]
        DB_TEMPLATES[("certificate_templates")]
        DB_VERSIONS[("template_versions")]

        DB_NOTIFICATIONS[("notifications")]
        DB_REPORTS[("reports")]

        DB_AUDIT[("audit_logs")]
        DB_SETTINGS[("system_settings")]
    end

    USER_REPO --> DB_USERS
    STUDENT_REPO --> DB_STUDENTS
    FACULTY_REPO --> DB_FACULTY

    DEPARTMENT_REPO --> DB_DEPARTMENTS
    COURSE_REPO --> DB_COURSES
    SUBJECT_REPO --> DB_SUBJECTS

    ATTENDANCE_REPO --> DB_ATTENDANCE
    MARKS_REPO --> DB_MARKS
    TIMETABLE_REPO --> DB_TIMETABLE

    EVENT_REPO --> DB_EVENTS
    PARTICIPANT_REPO --> DB_PARTICIPANTS

    CERT_REPO --> DB_CERTIFICATES
    TEMPLATE_REPO --> DB_TEMPLATES

    CERT_SERVICE --> DB_VERSIONS

    NOTIFICATION_REPO --> DB_NOTIFICATIONS
    REPORT_REPO --> DB_REPORTS
    AUDIT_REPO --> DB_AUDIT

    SETTINGS_SERVICE --> DB_SETTINGS

    %% =========================
    %% ACADEMIC RELATIONSHIPS
    %% =========================

    DB_DEPARTMENTS --> DB_COURSES
    DB_COURSES --> DB_SUBJECTS
    DB_SUBJECTS --> DB_TIMETABLE
    DB_TIMETABLE --> DB_ATTENDANCE
    DB_SUBJECTS --> DB_MARKS

    %% =========================
    %% ATTENDANCE
    %% =========================

    ATTENDANCE_SERVICE -.->|"Subject → Faculty → Section → Students"| DB_ATTENDANCE

    %% =========================
    %% EVENTS & CERTIFICATES
    %% =========================

    EVENT_SERVICE -.->|"Event → Participants → Results"| CERT_SERVICE

    CERT_SERVICE -.->|"Generate Unique Certificate ID"| DB_CERTIFICATES
    CERT_SERVICE -.->|"Published Template"| DB_TEMPLATES
    CERT_SERVICE -.->|"Versioned Template"| DB_VERSIONS

    %% =========================
    %% PUBLIC VERIFICATION
    %% =========================

    VERIFICATION_SERVICE -->|"Read-only verification"| DB_CERTIFICATES

    VERIFICATION_SERVICE -->|"VALID / INVALID / REVOKED"| PUBLIC_VERIFY

    %% =========================
    %% NOTIFICATIONS
    %% =========================

    ATTENDANCE_SERVICE -.-> NOTIFICATION_SERVICE
    EVENT_SERVICE -.-> NOTIFICATION_SERVICE
    CERT_SERVICE -.-> NOTIFICATION_SERVICE
    MARKS_SERVICE -.-> NOTIFICATION_SERVICE

    %% =========================
    %% REPORTING
    %% =========================

    ATTENDANCE_SERVICE -.-> REPORT_SERVICE
    MARKS_SERVICE -.-> REPORT_SERVICE
    EVENT_SERVICE -.-> REPORT_SERVICE
    CERT_SERVICE -.-> REPORT_SERVICE

    %% =========================
    %% STYLING
    %% =========================

    classDef user fill:#fff3cd,stroke:#b8860b,color:#111,stroke-width:2px;
    classDef frontend fill:#e8f4ff,stroke:#1565c0,color:#111,stroke-width:2px;
    classDef backend fill:#e8f5e9,stroke:#2e7d32,color:#111,stroke-width:2px;
    classDef service fill:#f3e5f5,stroke:#7b1fa2,color:#111,stroke-width:2px;
    classDef repo fill:#fff8e1,stroke:#f57f17,color:#111,stroke-width:2px;
    classDef database fill:#e0f2f1,stroke:#00695c,color:#111,stroke-width:2px;

    class ADMIN,FACULTY,STUDENT,PUBLIC user;
    class LOGIN,ADMIN_UI,FACULTY_UI,STUDENT_UI,PROFILE_UI,DASHBOARD,STUDENT_MODULES,FACULTY_MODULES,ADMIN_MODULES,PUBLIC_VERIFY frontend;
    class API,AUTH,VALIDATION,EXCEPTION,AOP backend;
    class USER_SERVICE,STUDENT_SERVICE,FACULTY_SERVICE,ACADEMIC_SERVICE,ATTENDANCE_SERVICE,MARKS_SERVICE,TIMETABLE_SERVICE,EVENT_SERVICE,CERT_SERVICE,NOTIFICATION_SERVICE,REPORT_SERVICE,PROFILE_SERVICE,SETTINGS_SERVICE,VERIFICATION_SERVICE service;
    class USER_REPO,STUDENT_REPO,FACULTY_REPO,DEPARTMENT_REPO,COURSE_REPO,SUBJECT_REPO,ATTENDANCE_REPO,MARKS_REPO,TIMETABLE_REPO,EVENT_REPO,PARTICIPANT_REPO,CERT_REPO,TEMPLATE_REPO,NOTIFICATION_REPO,REPORT_REPO,AUDIT_REPO repo;
    class DB_USERS,DB_STUDENTS,DB_FACULTY,DB_DEPARTMENTS,DB_COURSES,DB_SUBJECTS,DB_ATTENDANCE,DB_MARKS,DB_TIMETABLE,DB_EVENTS,DB_PARTICIPANTS,DB_CERTIFICATES,DB_TEMPLATES,DB_VERSIONS,DB_NOTIFICATIONS,DB_REPORTS,DB_AUDIT,DB_SETTINGS database;
