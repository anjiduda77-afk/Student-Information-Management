package com.sms.dto;

import com.sms.entity.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class AppDTO {

    // ---- User / Student / Faculty Response ----
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserResponse {
        private Long id;
        private String name;
        private String email;
        private String role;
        private String mobileNumber;
        private LocalDate dateOfBirth;
        private String gender;
        private String address;
        private String profilePhoto;
        private String status;

        // Student fields
        private String studentId;
        private String rollNumber;
        private String branch;
        private Integer semester;
        private String section;
        private Integer admissionYear;
        private String academicYear;
        private String department;

        // Faculty fields
        private String facultyId;
        private String designation;
        private List<String> assignedSubjects;
        private String qualification;
        private String specialization;
        private String experience;

        // Security
        private Boolean forcePasswordChange;
        private LocalDateTime lastPasswordChange;

        public static UserResponse from(User u) {
            return UserResponse.builder()
                    .id(u.getId())
                    .name(u.getName())
                    .email(u.getEmail())
                    .role(u.getRole().name())
                    .mobileNumber(u.getMobileNumber())
                    .dateOfBirth(u.getDateOfBirth())
                    .gender(u.getGender())
                    .address(u.getAddress())
                    .profilePhoto(u.getProfilePhoto())
                    .status(u.getStatus() != null ? u.getStatus() : "ACTIVE")
                    .studentId(u.getStudentId())
                    .rollNumber(u.getRollNumber())
                    .branch(u.getBranch())
                    .semester(u.getSemester())
                    .section(u.getSection())
                    .admissionYear(u.getAdmissionYear())
                    .academicYear(u.getAcademicYear())
                    .department(u.getDepartment())
                    .facultyId(u.getFacultyId())
                    .designation(u.getDesignation())
                    .qualification(u.getQualification())
                    .specialization(u.getSpecialization())
                    .experience(u.getExperience())
                    .forcePasswordChange(u.getForcePasswordChange())
                    .lastPasswordChange(u.getLastPasswordChange())
                    .build();
        }
    }

    // ---- Department ----
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DepartmentDTO {
        private Long id;

        @NotBlank(message = "Department code is required")
        private String code;

        @NotBlank(message = "Department name is required")
        private String name;

        private String headOfDepartment;
        private String description;
        private String status;
        private Long studentCount;
        private Long facultyCount;
    }

    // ---- Course ----
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CourseResponse {
        private Long id;
        private String code;
        private String name;
        private String description;
        private Integer credits;
        private Integer semester;
        private String duration;
        private String status;
        private String departmentName;
        private Long departmentId;
        private String facultyName;
        private Long facultyId;
        private Integer studentCount;

        public static CourseResponse from(Course c) {
            return CourseResponse.builder()
                    .id(c.getId())
                    .code(c.getCode())
                    .name(c.getName())
                    .description(c.getDescription())
                    .credits(c.getCredits())
                    .semester(c.getSemester())
                    .duration(c.getDuration())
                    .status(c.getStatus() != null ? c.getStatus() : "ACTIVE")
                    .departmentName(c.getDepartment() != null ? c.getDepartment().getName() : null)
                    .departmentId(c.getDepartment() != null ? c.getDepartment().getId() : null)
                    .facultyName(c.getFaculty() != null ? c.getFaculty().getName() : null)
                    .facultyId(c.getFaculty() != null ? c.getFaculty().getId() : null)
                    .studentCount(c.getStudents() != null ? c.getStudents().size() : 0)
                    .build();
        }
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CourseRequest {
        @NotBlank(message = "Course code is required")
        private String code;

        @NotBlank(message = "Course name is required")
        private String name;

        private String description;

        @NotNull(message = "Credits are required")
        @Min(value = 1, message = "Credits must be at least 1")
        @Max(value = 10, message = "Credits cannot exceed 10")
        private Integer credits;

        @NotNull(message = "Semester is required")
        @Min(value = 1, message = "Semester must be between 1 and 8")
        @Max(value = 8, message = "Semester must be between 1 and 8")
        private Integer semester;

        private String duration;
        private Long departmentId;
        private Long facultyId;
        private String status;
    }

    // ---- Subject ----
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SubjectDTO {
        private Long id;

        @NotBlank(message = "Subject code is required")
        private String code;

        @NotBlank(message = "Subject name is required")
        private String name;

        @NotNull(message = "Course ID is required")
        private Long courseId;

        private String courseName;
        private Integer semester;
        private Integer credits;
        private Long facultyId;
        private String facultyName;
        private String status;

        public static SubjectDTO from(Subject s) {
            return SubjectDTO.builder()
                    .id(s.getId())
                    .code(s.getCode())
                    .name(s.getName())
                    .courseId(s.getCourse() != null ? s.getCourse().getId() : null)
                    .courseName(s.getCourse() != null ? s.getCourse().getName() : null)
                    .semester(s.getSemester())
                    .credits(s.getCredits())
                    .facultyId(s.getFaculty() != null ? s.getFaculty().getId() : null)
                    .facultyName(s.getFaculty() != null ? s.getFaculty().getName() : null)
                    .status(s.getStatus())
                    .build();
        }
    }

    // ---- Attendance ----
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class AttendanceRequest {
        @NotNull(message = "Student ID is required")
        private Long studentId;

        private Long courseId;
        private Long subjectId;
        private Long sessionId;

        @NotNull(message = "Attendance date is required")
        private LocalDate date;

        @NotNull(message = "Attendance status is required")
        private Attendance.Status status;

        private String verificationMethod;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AttendanceResponse {
        private Long id;
        private Long studentId;
        private String studentName;
        private String rollNumber;
        private Long courseId;
        private String courseName;
        private Long subjectId;
        private String subjectName;
        private String subjectCode;
        private Long facultyId;
        private String facultyName;
        private Integer period;
        private String section;
        private String dayOfWeek;
        private String room;
        private Long sessionId;
        private LocalDate date;
        private String status;
        private String verificationMethod;
        private LocalDateTime markedAt;
        private Double percentage;

        public static AttendanceResponse from(Attendance a) {
            String subName = a.getSubject() != null ? a.getSubject().getName()
                    : (a.getCourse() != null ? a.getCourse().getName() : "Subject");
            String subCode = a.getSubject() != null ? a.getSubject().getCode()
                    : (a.getCourse() != null ? a.getCourse().getCode() : "SUB");
            String facName = a.getFaculty() != null ? a.getFaculty().getName()
                    : (a.getSession() != null && a.getSession().getFaculty() != null ? a.getSession().getFaculty().getName() : null);
            Long facId = a.getFaculty() != null ? a.getFaculty().getId()
                    : (a.getSession() != null && a.getSession().getFaculty() != null ? a.getSession().getFaculty().getId() : null);
            Integer per = a.getPeriod() != null ? a.getPeriod()
                    : (a.getSession() != null ? a.getSession().getPeriod() : 1);
            String sec = a.getSection() != null ? a.getSection()
                    : (a.getSession() != null ? a.getSession().getSection() : (a.getStudent() != null ? a.getStudent().getSection() : "A"));
            String rm = a.getSession() != null ? a.getSession().getRoom() : null;

            return AttendanceResponse.builder()
                    .id(a.getId())
                    .studentId(a.getStudent() != null ? a.getStudent().getId() : null)
                    .studentName(a.getStudent() != null ? a.getStudent().getName() : null)
                    .rollNumber(a.getStudent() != null ? a.getStudent().getRollNumber() : null)
                    .courseId(a.getCourse() != null ? a.getCourse().getId() : null)
                    .courseName(a.getCourse() != null ? a.getCourse().getName() : subName)
                    .subjectId(a.getSubject() != null ? a.getSubject().getId() : null)
                    .subjectName(subName)
                    .subjectCode(subCode)
                    .facultyId(facId)
                    .facultyName(facName)
                    .period(per)
                    .section(sec)
                    .dayOfWeek(a.getDate() != null ? a.getDate().getDayOfWeek().name() : null)
                    .room(rm)
                    .sessionId(a.getSession() != null ? a.getSession().getId() : null)
                    .date(a.getDate())
                    .status(a.getStatus().name())
                    .verificationMethod(a.getVerificationMethod())
                    .markedAt(a.getMarkedAt())
                    .build();
        }
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AttendanceSessionDTO {
        private Long id;
        private String sessionCode;
        private Long courseId;
        private String courseName;
        private Long departmentId;
        private String departmentName;
        private Long subjectId;
        private String subjectName;
        private String subjectCode;
        private Long facultyId;
        private String facultyName;
        private LocalDate date;
        private Integer period;
        private java.time.LocalTime startTime;
        private java.time.LocalTime endTime;
        private String room;
        private String section;
        private String academicYear;
        private Integer semester;
        private LocalDateTime createdAt;
        private LocalDateTime expiresAt;
        private String status;
        private String sessionType;
        private long totalStudents;
        private long presentCount;
        private long absentCount;
        private long lateCount;
        private long excusedCount;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CheckInRequest {
        @NotBlank(message = "Session code is required")
        private String sessionCode;

        private String verificationMethod; // ONLINE_CODE, QR_SCAN
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AttendanceCorrectionDTO {
        private Long id;
        private Long studentId;
        private String studentName;
        private String rollNumber;

        @NotNull(message = "Course ID is required")
        private Long courseId;

        private String courseName;

        @NotNull(message = "Attendance date is required")
        private LocalDate attendanceDate;

        private String previousStatus;
        private String requestedStatus;

        @NotBlank(message = "Reason for correction is required")
        private String reason;

        private String status; // PENDING, APPROVED, REJECTED
        private String remarks;
        private LocalDateTime createdAt;
        private LocalDateTime reviewedAt;
        private String reviewedByName;
    }

    // ---- Marks ----
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class MarksRequest {
        @NotNull(message = "Student ID is required")
        private Long studentId;

        private Long courseId;
        private Long subjectId;

        @NotBlank(message = "Exam type is required")
        private String examType;

        @NotNull(message = "Marks obtained is required")
        @DecimalMin(value = "0.0", message = "Marks cannot be negative")
        private Double marksObtained;

        @NotNull(message = "Total marks is required")
        @DecimalMin(value = "1.0", message = "Total marks must be greater than 0")
        private Double totalMarks;

        private String remarks;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MarksResponse {
        private Long id;
        private Long studentId;
        private String studentName;
        private String rollNumber;
        private Long courseId;
        private String courseName;
        private String examType;
        private Double marksObtained;
        private Double totalMarks;
        private String grade;
        private Double percentage;
        private String remarks;
        private LocalDateTime uploadedAt;

        public static MarksResponse from(Marks m) {
            double pct = (m.getMarksObtained() / m.getTotalMarks()) * 100;
            return MarksResponse.builder()
                    .id(m.getId())
                    .studentId(m.getStudent().getId())
                    .studentName(m.getStudent().getName())
                    .rollNumber(m.getStudent().getRollNumber())
                    .courseId(m.getCourse() != null ? m.getCourse().getId() : null)
                    .courseName(m.getCourse() != null ? m.getCourse().getName() : "Course")
                    .examType(m.getExamType().name())
                    .marksObtained(m.getMarksObtained())
                    .totalMarks(m.getTotalMarks())
                    .grade(m.getGrade())
                    .percentage(Math.round(pct * 10.0) / 10.0)
                    .uploadedAt(m.getUploadedAt())
                    .build();
        }
    }

    // ---- Timetable ----
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TimetableDTO {
        private Long id;
        private Long departmentId;
        private String departmentName;

        @NotNull(message = "Course ID is required")
        private Long courseId;

        private String courseName;
        private String academicYear;

        @Min(value = 1, message = "Semester must be between 1 and 8")
        @Max(value = 8, message = "Semester must be between 1 and 8")
        private Integer semester;

        private String section;
        private Integer period; // 1, 2, 3, etc.
        private Long subjectId;
        private String subjectName;
        private String subjectCode;
        private String programmeName;
        private String year;

        @NotNull(message = "Faculty ID is required")
        private Long facultyId;

        private String facultyName;

        @NotBlank(message = "Day of week is required")
        private String dayOfWeek;

        @NotNull(message = "Start time is required")
        private LocalTime startTime;

        @NotNull(message = "End time is required")
        private LocalTime endTime;

        @NotBlank(message = "Classroom is required")
        private String classroom;

        private String status;
    }

    // ---- Attendance Academic Structures ----
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class FacultyTodayClassDTO {
        private Long timetableId;
        private Integer period;
        private LocalTime startTime;
        private LocalTime endTime;
        private Long courseId;
        private String courseName;
        private String programmeName;
        private Long departmentId;
        private String departmentName;
        private Long subjectId;
        private String subjectName;
        private String subjectCode;
        private Integer semester;
        private String year;
        private String section;
        private String classroom;
        private Long activeSessionId;
        private String sessionCode;
        private String sessionStatus; // NONE, ACTIVE, CLOSED
        private Long totalStudents;
        private Long presentCount;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AttendanceSubjectSummaryDTO {
        private Long subjectId;
        private String subjectCode;
        private String subjectName;
        private Long courseId;
        private String courseName;
        private Long facultyId;
        private String facultyName;
        private String section;
        private Integer semester;
        private long totalClasses;
        private long attendedClasses;
        private long absentClasses;
        private long lateClasses;
        private long excusedClasses;
        private double percentage;
        private Double attendancePercentage;
        private String status; // Good, Shortage
        private boolean isShortage; // true if < 75%
        private boolean hasShortage; // alias
        private Long enrolledStudents;
        private Long studentsWithShortage;

        public Double getAttendancePercentage() {
            return attendancePercentage != null ? attendancePercentage : percentage;
        }

        public boolean isHasShortage() {
            return isShortage;
        }
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ShortageStudentDTO {
        private Long studentId;
        private String studentName;
        private String rollNumber;
        private String department;
        private String programme;
        private Integer semester;
        private String section;
        private Long subjectId;
        private String subjectCode;
        private String subjectName;
        private long totalClasses;
        private long attendedClasses;
        private long presentClasses;
        private double percentage;
        private Double attendancePercentage;

        public Double getAttendancePercentage() {
            return attendancePercentage != null ? attendancePercentage : percentage;
        }

        public long getAttendedClasses() {
            return attendedClasses > 0 ? attendedClasses : presentClasses;
        }
    }

    // ---- Manual Attendance Flow ----
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ManualAttendanceRosterResponse {
        private LocalDate date;
        private String department;
        private String departmentName;
        private String section;
        private Long facultyId;
        private String facultyName;
        private Long subjectId;
        private String subjectName;
        private String subjectCode;
        private Integer period;
        private Long courseId;
        private String courseName;
        private String classroom;
        private boolean isExisting;
        private List<StudentRosterItem> students;
        private long presentCount;
        private long absentCount;
        private long lateCount;
        private long excusedCount;
        private long totalCount;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StudentRosterItem {
        private Long studentId;
        private String name;
        private String rollNumber;
        private String department;
        private String section;
        private Attendance.Status status;
        private String remarks;
        private Long attendanceId;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SaveManualAttendanceRequest {
        private LocalDate date;
        private String department;
        private String section;
        private Long subjectId;
        private Integer period;
        private List<StudentStatusRecord> records;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class StudentStatusRecord {
        private Long studentId;
        private Attendance.Status status;
        private String remarks;
    }

    // ---- Event ----
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EventDTO {
        private Long id;
        private String eventCode;

        @NotBlank(message = "Event title is required")
        private String title;

        private String description;
        private String category;
        private String department;
        private String posterUrl;

        @NotNull(message = "Event date is required")
        private LocalDate eventDate;

        private LocalTime startTime;
        private LocalTime endTime;
        private String venue;
        private String organizer;
        private Long coordinatorId;
        private String coordinatorName;
        private List<EventCoordinatorDTO> coordinators;
        private Integer maxParticipants;
        private LocalDateTime registrationDeadline;
        private String rules;
        private String status;
        private long participantCount;
        private boolean isRegistered;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EventCoordinatorDTO {
        private Long id;
        private Long eventId;
        private String eventTitle;
        private Long facultyId;
        private String facultyName;
        private String facultyEmail;
        private String facultyDepartment;
        private String facultyDesignation;
        private String facultyMobile;
        private String assignedByName;
        private LocalDateTime assignedAt;
        private String status;
        private String remarks;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class AssignCoordinatorRequest {
        @NotNull(message = "Faculty ID is required")
        private Long facultyId;
        private String remarks;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EventParticipantDTO {
        private Long id;
        private Long eventId;
        private String eventTitle;
        private Long studentId;
        private String studentName;
        private String rollNumber;
        private String department;
        private Integer semester;
        private LocalDateTime registeredAt;
        private String registrationStatus;
        private String attendanceStatus;
        private String resultPosition;
        private String certificateId;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ResultSubmitRequest {
        @NotNull(message = "Student ID is required")
        private Long studentId;

        @NotBlank(message = "Position is required")
        private String position; // WINNER, RUNNER_UP, SECOND_RUNNER_UP, SPECIAL_RECOGNITION, PARTICIPANT, NO_CERTIFICATE

        private Double score;
        private String remarks;
    }

    // ---- Certificate ----
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CertificateDTO {
        private Long id;
        private String certificateId;
        private Long studentId;
        private String studentName;
        private String rollNumber;
        private Long eventId;
        private String eventName;
        private Long templateId;
        private String templateName;
        private Integer templateVersion;
        private String certificateType;
        private String position;
        private LocalDate issueDate;
        private String collegeName;
        private String departmentName;
        private String verificationUrl;
        private String status; // VALID, REVOKED
        private String signatoryName;
        private String signatoryTitle;
        private String revocationReason;
        private LocalDateTime revokedAt;
        private String revokedByName;
        private String replacedByCertificateId;
        private LocalDateTime generatedAt;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CertificateTemplateDTO {
        private Long id;

        @NotBlank(message = "Template name is required")
        private String name;

        @NotBlank(message = "Certificate type is required")
        private String templateType;

        private String title;
        private String subtitle;
        private String collegeName;
        private String description;
        private String borderStyle;
        private Integer borderWidth;
        private String borderColor;
        private String fontFamily;
        private Integer fontSize;
        private String fontWeight;
        private String textAlignment;
        private String textColor;
        private String primaryColor;
        private String secondaryColor;
        private String backgroundColor;
        private String signatoryTitle;
        private String signatoryName;
        private String signatory2Title;
        private String signatory2Name;
        private String logoUrl;
        private String signatureUrl;
        private String bodyTemplate;
        private String status; // DRAFT, PUBLISHED
        private Integer version;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class GenerateCertificateRequest {
        @NotNull(message = "Event ID is required")
        private Long eventId;

        @NotNull(message = "Student ID is required")
        private Long studentId;

        @NotBlank(message = "Certificate type is required")
        private String certificateType; // WINNER, RUNNER_UP, PARTICIPATION, ACHIEVEMENT, SPECIAL_RECOGNITION

        private String position;
        private Long templateId;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class RevokeCertificateRequest {
        @NotBlank(message = "Revocation reason is required")
        private String reason;
    }

    // ---- Password & Account Security ----
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;

        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "Password must be at least 8 characters long")
        private String newPassword;

        @NotBlank(message = "Confirm password is required")
        private String confirmPassword;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class AdminResetPasswordRequest {
        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "Password must be at least 8 characters long")
        private String newPassword;

        private String confirmPassword;
        private Boolean forceChangeOnNextLogin;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class UpdatePhotoRequest {
        @NotBlank(message = "Profile photo URL is required")
        private String photoUrl;
    }

    // ---- Announcement ----
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AnnouncementDTO {
        private Long id;

        @NotBlank(message = "Announcement title is required")
        private String title;

        @NotBlank(message = "Announcement content is required")
        private String content;

        private String category;
        private String priority;
        private String targetRole;
        private String targetDepartment;
        private LocalDate startDate;
        private LocalDate endDate;
        private Boolean active;
        private String createdByName;
        private LocalDateTime createdAt;
    }

    // ---- Notification ----
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class NotificationDTO {
        private Long id;
        private String title;
        private String message;
        private String type;
        private String link;
        private Boolean isRead;
        private LocalDateTime createdAt;
    }

    // ---- Activity Log ----
    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ActivityLogDTO {
        private Long id;
        private String userEmail;
        private String userName;
        private String userRole;
        private String action;
        private String module;
        private String entityName;
        private String entityId;
        private String oldValue;
        private String newValue;
        private String description;
        private String ipAddress;
        private LocalDateTime timestamp;
    }

    // ---- Generic ----
    @Getter @Setter @AllArgsConstructor @NoArgsConstructor
    public static class MessageResponse {
        private String message;
    }

    @Getter @Setter @AllArgsConstructor @NoArgsConstructor
    public static class EnrollRequest {
        @NotNull(message = "Student ID is required")
        private Long studentId;

        @NotNull(message = "Course ID is required")
        private Long courseId;
    }

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Notification {
        private String type;
        private String message;
        private String courseName;
        private String grade;
    }
}

