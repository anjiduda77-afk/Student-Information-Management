package com.sms.dto;

import com.sms.entity.User;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

public class AuthDTO {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "Username / ID / Email is required")
        private String identifier; // Can be Email, Student ID, Faculty ID, or Roll Number

        // Backwards compatibility if frontend passes "email"
        public String getIdentifier() {
            return identifier != null ? identifier : email;
        }

        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LoginResponse {
        private String token;
        private String role;
        private Long userId;
        private String name;
        private String email;
        private String studentId;
        private String rollNumber;
        private String facultyId;
        private String department;
        private Integer semester;
        private String section;
        private String designation;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "Name is required") 
        private String name;

        @NotBlank(message = "Email is required")
        @jakarta.validation.constraints.Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @jakarta.validation.constraints.Size(min = 6, message = "Password must be at least 6 characters long")
        private String password;

        private User.Role role;
        // Student fields
        private String studentId;
        private String rollNumber;
        private String branch;
        private Integer semester;
        private String section;
        private Integer admissionYear;
        private String academicYear;
        private LocalDate dateOfBirth;
        private String gender;

        @jakarta.validation.constraints.Pattern(regexp = "^$|^[6-9]\\d{9}$", message = "Mobile number must be a valid 10-digit number starting with 6-9")
        private String mobileNumber;

        private String address;
        // Faculty fields
        private String facultyId;
        private String department;
        private String designation;
    }
}
