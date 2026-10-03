package com.sms.controller;

import com.sms.dto.AppDTO;
import com.sms.dto.AuthDTO;
import com.sms.entity.User;
import com.sms.repository.UserRepository;
import com.sms.security.JwtUtil;
import com.sms.service.ActivityLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogService activityLogService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthDTO.LoginRequest request) {
        String identifier = request.getIdentifier();
        if (identifier == null || identifier.isBlank()) {
            return ResponseEntity.badRequest().body(new AppDTO.MessageResponse("Student ID, Faculty ID, or Email is required."));
        }

        // Locate user by identifier
        User user = userRepository.findByIdentifier(identifier.trim())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(401).body(new AppDTO.MessageResponse("Invalid credentials: User not found."));
        }

        if ("INACTIVE".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.status(403).body(new AppDTO.MessageResponse("Account is deactivated. Please contact the administrator."));
        }

        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(new AppDTO.MessageResponse("Invalid credentials: Incorrect password."));
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails, user.getRole().name());

        // Log login activity
        activityLogService.log(user.getEmail(), user.getName(), user.getRole().name(),
                "LOGIN", "AUTH", "Successful authentication via " + user.getRole().name() + " portal");

        return ResponseEntity.ok(AuthDTO.LoginResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .studentId(user.getStudentId())
                .rollNumber(user.getRollNumber())
                .facultyId(user.getFacultyId())
                .department(user.getDepartment() != null ? user.getDepartment() : user.getBranch())
                .semester(user.getSemester())
                .section(user.getSection())
                .designation(user.getDesignation())
                .build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthDTO.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(new AppDTO.MessageResponse("Email already registered"));
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : User.Role.STUDENT)
                .studentId(request.getStudentId())
                .rollNumber(request.getRollNumber())
                .branch(request.getBranch())
                .department(request.getDepartment() != null ? request.getDepartment() : request.getBranch())
                .semester(request.getSemester())
                .section(request.getSection() != null ? request.getSection() : "A")
                .facultyId(request.getFacultyId())
                .designation(request.getDesignation())
                .status("ACTIVE")
                .build();

        userRepository.save(user);
        return ResponseEntity.ok(new AppDTO.MessageResponse("User registered successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(new AppDTO.MessageResponse("Unauthenticated"));
        }
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(AppDTO.UserResponse.from(user));
    }
}
