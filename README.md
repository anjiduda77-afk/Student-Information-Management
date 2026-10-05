# Smart Student Information System

### Aditya University

A comprehensive, production-grade university information management system designed for **Aditya University** to streamline academic operations, attendance monitoring, examination grading, event coordination, and digital certificate issuance across departments.

---

## Overview

Smart Student Information System is a university management application developed for Aditya University to manage student, faculty, academic, attendance, event and certificate related activities through a centralised web-based system.

The application delivers tailored, role-based workflows for **Students**, **Faculty members**, and **University Administrators**, ensuring secure access, real-time academic tracking, automated timetable scheduling, live class check-ins, and tamper-proof certificate verification with QR codes.

---

## Features

- **Role-Based Access Control (RBAC)**: Secure multi-tier authentication for Administrators, Faculty, and Students using JSON Web Tokens (JWT) and BCrypt password encryption.
- **Academic Administration**: Comprehensive management of university departments (CSE, AIML, ECE, EEE, MECH), degree courses, semesters, sections, subjects, and student enrollments.
- **Interactive Timetable Scheduling**: Day-wise and period-wise timetable system linking subjects, faculty members, sections, and classroom allocations.
- **Smart Attendance System**:
  - Live faculty-generated 6-digit attendance session codes with automated expiry.
  - Manual roster checklist with Present, Absent, Late, and Excused status support.
  - Student subject-wise attendance percentages with automatic shortage alerts (<75%).
  - Date-wise historical attendance search with custom date range and preset filters.
  - Administrative attendance audit and correction ledger with justification remarks.
- **Marks & Examination Portal**: Faculty mark entry for internal assessments, lab evaluations, and semester exams, along with GPA/CGPA computation for student scorecards.
- **Campus Event Management**: End-to-end event lifecycle handling from announcements and coordinator assignments to student registration, seat limits, and result declaration.
- **Digital Certificate Engine**:
  - Administrative template customizer with dynamic variables, customizable borders, and official seals.
  - Dynamic OpenPDF server-side certificate generation and client-side high-resolution rendering.
  - Public verification portal with unique certificate IDs and cryptographic QR codes.
- **Real-Time Notifications & Activity Logs**: Institutional circulars, broadcast notices, and audit logging of administrative changes.

---

## User Roles

### 1. Student Portal
- **Dashboard**: Enrolled degree programme overview, current semester, overall attendance percentage, and academic notices.
- **Subject-Wise Attendance**: Real-time breakdown of attended vs total classes, percentage indicators, and attendance shortage indicators (<75%).
- **Attendance Check-In**: Instant self-check-in during lectures using active 6-digit session codes issued by faculty.
- **Timetable View**: Weekly lecture timetable displaying periods, subjects, assigned faculty, and lecture halls.
- **Academic Marks**: Semester-wise internal test scores, semester grades, and academic performance tracking.
- **Events & Activities**: Browse university events, technical symposiums, hackathons, and register in a single click.
- **My Certificates**: View, preview, and download digitally generated merit and participation certificates with verification QR codes.

### 2. Faculty Portal
- **Dashboard**: Teaching schedule, assigned course modules, student strength, and quick actions.
- **Daily Class Attendance**: View today's scheduled classes mapped to timetable periods, launch live attendance sessions, and monitor real-time check-ins.
- **Manual Attendance Marking**: Complete roster view of enrolled students with one-click bulk status toggling (Present / Absent / Late / Excused).
- **Subject Attendance Analytics**: Aggregate subject reports including total lectures taken, student presence count, and class averages.
- **Marks Management**: Input and update continuous assessment scores, mid-term marks, and semester end results.
- **Timetable Schedule**: Personal weekly teaching timetable with room allocations and period timings.
- **Event Coordination**: Oversee assigned collegiate events, manage candidate rosters, and publish winners and ranks.

### 3. Administrator Portal
- **Executive Dashboard**: University-wide metrics, active student counts, faculty directory statistics, active courses, and event counts.
- **Student Directory**: Student profile management, roll number assignment, course enrollment, semester promotion, and status management.
- **Faculty Directory**: Faculty onboarding, department tagging, designation assignments, and contact records.
- **Departments & Courses**: Department configuration (CSE, AIML, ECE, EEE, MECH) and course curriculum structuring with credit allocations.
- **Timetable Management**: Master timetable setup by department, year, semester, section, period, classroom, and faculty.
- **Attendance Oversight**: Institutional attendance statistics, college-wide shortage report generation (<75% threshold), and official correction approvals with audit remarks.
- **Event Administration**: University event scheduling, venue bookings, registration deadlines, and coordinator assignments.
- **Certificate Templates**: WYSIWYG certificate template designer, issuance approvals, certificate revocation, and verification tracking.

---

## Modules

| Module | Description | Primary Users |
| :--- | :--- | :--- |
| **Authentication & Profile** | JWT-based login, password updates, profile details, and role routing | All Users |
| **Academic Structure** | Departments, Degree Programmes, Subjects, and Credit structures | Admin |
| **Timetable Module** | Period-wise scheduling (Periods 1 to 6), day mapping, classroom allotment | Admin, Faculty, Students |
| **Attendance Management** | Real-time session check-in, manual roster entry, shortage reports, corrections | Faculty, Students, Admin |
| **Marks & Results** | Examination marks uploading, semester grade calculations, student scorecards | Faculty, Students, Admin |
| **Event Management** | Technical fests, workshops, registrations, coordinator assignment, results | Admin, Faculty, Students |
| **Certificate Engine** | Template designing, PDF generation, digital signing, and QR verification | Admin, Students, Public |
| **Announcements** | Departmental notices, circulars, and system broadcast messages | Admin, Faculty, Students |

---

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.2.0 (Java 17)
- **Security**: Spring Security 6 with stateless JWT (JSON Web Tokens)
- **Persistence**: Spring Data JPA & Hibernate ORM
- **Database**: MySQL 8.0 with HikariCP connection pooling
- **Document Generation**: OpenPDF for server-side digital certificate generation
- **Documentation**: Springdoc OpenAPI / Swagger UI
- **Build Tool**: Maven Wrapper (`./mvnw`)

### Frontend
- **Framework**: React 18 (SPA)
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS & Modern Vanilla CSS Design System
- **Icons**: Lucide React
- **Charts & Visualizations**: Recharts
- **HTTP Client**: Axios with automatic request/response token interceptors
- **Client-Side Rendering**: jsPDF, html2canvas, and QRCode canvas generator

---

## System Architecture

The Smart Student Information System follows a decoupled, three-tier enterprise client-server architecture:

```
┌────────────────────────────────────────────────────────┐
│                   React 18 Single Page App             │
│        (Tailwind CSS, Vite, Axios Interceptors)        │
└───────────────────────────┬────────────────────────────┘
                            │ RESTful JSON APIs / JWT
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Spring Boot 3.2.0 Backend              │
│  ┌───────────────────┐        ┌──────────────────────┐ │
│  │ Security & JWT    │        │ Controller Layer     │ │
│  │ Authentication    │        │ (Admin, Faculty,     │ │
│  └─────────┬─────────┘        │  Student, Verify)    │ │
│            │                  └──────────┬───────────┘ │
│            ▼                             ▼             │
│  ┌───────────────────────────────────────────────────┐ │
│  │                 Service Layer                     │ │
│  │ (Attendance, Timetable, Events, Certificate, etc.)│ │
│  └─────────────────────────┬─────────────────────────┘ │
│                            ▼                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │           Spring Data JPA Repositories            │ │
│  └─────────────────────────┬─────────────────────────┘ │
└────────────────────────────┼───────────────────────────┘
                             │ Hibernate ORM / HikariCP
                             ▼
┌────────────────────────────────────────────────────────┐
│                   MySQL 8.0 Database                   │
│   (Users, Courses, Timetables, Attendance, Events)     │
└────────────────────────────────────────────────────────┘
```

---

## Event Management

The Event Management module provides institutional governance for collegiate and inter-collegiate events:
- **Event Scheduling**: Administrators configure event titles, categories (Technical, Cultural, Sports, Workshop), dates, venues, maximum participant limits, and registration windows.
- **Faculty Coordinators**: Assign faculty members to supervise event logistics and review candidate rosters.
- **Student Registration**: Students browse upcoming events and register with automated duplicate prevention and capacity enforcement.
- **Results Declaration**: Publish winners, runners-up, and special commendations directly to participant portals.

---

## Certificate Management

A complete end-to-end digital credentialing system:
- **Template Customizer**: Configure certificate typography, institution headers, authorized signatory designations, and dynamic placeholders (`{{studentName}}`, `{{courseName}}`, `{{eventTitle}}`, `{{issueDate}}`, `{{certificateNumber}}`).
- **Generation & Download**: Issued certificates can be viewed in high-resolution preview and downloaded as authentic PDFs via OpenPDF.
- **Cryptographic QR Code**: Each certificate is stamped with a unique alphanumeric certificate identification number and an embedded verification URL.
- **Public Verification Page**: External employers and verifying bodies can scan the QR code or navigate to `/verify-certificate/:certificateNumber` to instantly confirm validity, issue date, recipient name, and issuer authority without requiring login.

---

## Attendance Management

Engineered to fulfill university statutory attendance compliance standards:
- **Timetable-Integrated Sessions**: Faculty initiate attendance directly from their scheduled timetable lecture slot for the day.
- **6-Digit Session Check-In**: Generates an expiring session code displayed in class for students to mark their presence from their personal devices.
- **Manual Overrides & Roster Mode**: Faculty can manually mark student presence or modify records (Present, Absent, Late, Excused) with immediate recalculation.
- **Mandatory 75% Threshold Alerting**: The system continuously monitors individual and course-level attendance percentages, highlighting shortage risks in red with warning alerts.
- **Official Correction Workflow**: Institutional administrators can review, modify, and excuse student attendance (e.g., for On-Duty medical or technical symposium leave) with required reason logging.

---

## Installation

### Prerequisites
- **Java Development Kit (JDK)**: Version 17 or higher
- **Node.js**: Version 18.x or higher with npm
- **MySQL Server**: Version 8.0 or higher
- **Git**: Installed and configured on your system

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/anjiduda77-afk/Student-Information-Management.git
cd Student-Information-Management
```

---

### Step 2: Database Setup
1. Start your local MySQL service.
2. Create the database:
```sql
CREATE DATABASE student_information_system;
```
3. Update your credentials in `backend/src/main/resources/application.properties` or provide environment variables:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/student_information_system?useSSL=false&serverTimezone=Asia/Kolkata&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=root
```

---

### Step 3: Run the Backend Server
Using the included Maven Wrapper:

**Windows (PowerShell / Command Prompt):**
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

**Linux / macOS:**
```bash
cd backend
chmod +x mvnw
./mvnw spring-boot:run
```
> The Spring Boot REST API will start at **`http://localhost:8080`**. Database schemas and initial seed data are populated automatically on startup.

---

### Step 4: Run the Frontend Application
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
> The Vite frontend will start at **`http://localhost:5173`** (or next available port, e.g., `http://localhost:5174`).

---

## Configuration

### Backend Configuration (`backend/src/main/resources/application.properties`)

| Key | Default Value | Description |
| :--- | :--- | :--- |
| `server.port` | `8080` | Spring Boot server port |
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/student_information_system` | MySQL connection string |
| `spring.datasource.username` | `root` | Database username |
| `spring.datasource.password` | `root` | Database password |
| `jwt.secret` | `mySecretKey1234567890mySecretKey1234567890...` | Secret key for JWT signing |
| `jwt.expiration` | `86400000` (24 Hours) | JWT token lifespan in milliseconds |
| `cors.allowed-origins` | `http://localhost:5173,http://localhost:5174,http://localhost:3000` | Allowed CORS origins |

---

## Project Structure

```
Smart-Student-Information-System/
├── .github/
│   ├── workflows/ci.yml             # Automated CI build pipeline
│   └── ISSUE_TEMPLATE/              # Standard issue templates
├── backend/                         # Spring Boot 3 Java Application
│   ├── .mvn/wrapper/                # Maven wrapper files
│   ├── mvnw / mvnw.cmd              # Cross-platform Maven scripts
│   ├── pom.xml                      # Maven project configuration & dependencies
│   └── src/main/
│       ├── java/com/sms/
│       │   ├── config/              # Security, CORS, WebSocket, and Data Initializers
│       │   ├── controller/          # REST API endpoints (Admin, Faculty, Student, Verify)
│       │   ├── dto/                 # Strongly-typed request/response data transfer objects
│       │   ├── entity/              # JPA domain entities (User, Timetable, Attendance, etc.)
│       │   ├── exception/           # Global exception handling and custom errors
│       │   ├── repository/          # Spring Data JPA repositories
│       │   ├── security/            # JWT filters, token utility, and user details service
│       │   └── service/             # Business logic layer and implementations
│       └── resources/
│           └── application.properties # Application environment settings
├── frontend/                        # React 18 + Vite Frontend Application
│   ├── public/                      # Static assets, university crest, and favicons
│   ├── src/
│   │   ├── components/
│   │   │   ├── attendance/          # Student, Faculty, and Admin attendance sections
│   │   │   ├── certificates/        # Certificate preview and generation components
│   │   │   ├── common/              # Layout, Header, Sidebar, Logo, and Backgrounds
│   │   │   └── timetable/           # Academic timetable matrix components
│   │   ├── context/                 # AuthContext and ThemeContext state management
│   │   ├── pages/                   # Admin, Faculty, Student, Login, and Verify views
│   │   │   └── admin/               # Admin event and certificate management sub-pages
│   │   ├── services/                # Axios HTTP client and API integration service
│   │   └── utils/                   # Certificate PDF generator and input validation
│   ├── package.json                 # Frontend dependencies and npm scripts
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   └── vite.config.js               # Vite dev server and proxy configuration
├── CONTRIBUTING.md                  # Development guidelines
├── LICENSE                          # MIT License
└── README.md                        # Master project documentation
```

---

## API Information

Interactive OpenAPI / Swagger documentation is available when the backend server is running:
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:8080/api-docs`

### Core REST Endpoints

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user and issue JWT token | Public |
| `POST` | `/api/auth/register` | Register new user account | Admin |
| `GET` | `/api/student/attendance/subject-wise` | Retrieve subject attendance percentages | Student |
| `POST` | `/api/student/attendance/check-in` | Check in using active 6-digit session code | Student |
| `GET` | `/api/student/timetable` | Fetch student weekly class schedule | Student |
| `GET` | `/api/faculty/attendance/today-classes` | Fetch faculty scheduled classes for today | Faculty |
| `POST` | `/api/faculty/attendance/session/start-from-timetable/{id}` | Start live attendance session | Faculty |
| `POST` | `/api/faculty/attendance/session/{id}/manual` | Submit manual attendance roster | Faculty |
| `GET` | `/api/faculty/attendance/subject-summary` | Get faculty subject aggregate statistics | Faculty |
| `GET` | `/api/admin/attendance/overview` | Fetch institutional attendance metrics | Admin |
| `GET` | `/api/admin/attendance/shortage-report` | Generate student shortage report (<75%) | Admin |
| `POST` | `/api/admin/attendance/{id}/correct` | Administratively correct attendance record | Admin |
| `GET` | `/api/events` | List all university events | Authenticated |
| `POST` | `/api/events/{id}/register` | Register student for an event | Student |
| `GET` | `/api/certificates/my` | Retrieve student's issued certificates | Student |
| `GET` | `/api/public/verify/{certificateNumber}` | Public certificate authenticity verification | Public |

---

## Future Enhancements

- **Biometric Integration**: Support for thumbprint and facial recognition hardware integration at classroom entry points.
- **SMS & WhatsApp Alerts**: Automated instant SMS and WhatsApp notifications sent to parents when student attendance drops below 75%.
- **Hostel & Transport Management**: Extended modules for university hostel room allocations, fee ledgers, and bus route tracking.
- **Mobile Application**: Cross-platform mobile app built with React Native for push notifications and offline timetable viewing.

---

## Author

- **Developer**: Vijay
- **Institution**: Aditya University
- **Project**: Smart Student Information System
