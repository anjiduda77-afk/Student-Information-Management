package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.dto.AuthDTO;
import com.sms.entity.User;
import com.sms.exception.ConflictException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.UserRepository;
import com.sms.service.FacultyService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FacultyServiceImpl implements FacultyService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<AppDTO.UserResponse> getAllFaculty() {
        return userRepository.findByRole(User.Role.FACULTY)
                .stream()
                .map(AppDTO.UserResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public AppDTO.UserResponse getFacultyById(Long id) {
        return AppDTO.UserResponse.from(getFacultyEntity(id));
    }

    @Override
    public User getFacultyEntity(Long id) {
        return userRepository.findById(id)
                .filter(u -> u.getRole() == User.Role.FACULTY)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with ID: " + id));
    }

    @Override
    @Transactional
    public AppDTO.UserResponse addFaculty(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered: " + request.getEmail());
        }
        if (request.getFacultyId() != null && userRepository.existsByFacultyId(request.getFacultyId())) {
            throw new ConflictException("Duplicate Faculty ID: " + request.getFacultyId());
        }

        String facultyId = request.getFacultyId();
        if (facultyId == null || facultyId.isBlank()) {
            facultyId = "FAC-" + (request.getDepartment() != null ? request.getDepartment().toUpperCase() : "ENG") + "-" + String.format("%03d", (int)(Math.random() * 900 + 100));
        }

        User faculty = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword() != null ? request.getPassword() : "Faculty@123"))
                .role(User.Role.FACULTY)
                .facultyId(facultyId)
                .department(request.getDepartment())
                .designation(request.getDesignation() != null ? request.getDesignation() : "Assistant Professor")
                .mobileNumber(request.getMobileNumber())
                .address(request.getAddress())
                .status("ACTIVE")
                .build();

        return AppDTO.UserResponse.from(userRepository.save(faculty));
    }

    @Override
    @Transactional
    public AppDTO.UserResponse updateFaculty(Long id, AppDTO.UserResponse request) {
        User faculty = getFacultyEntity(id);

        if (request.getName() != null) faculty.setName(request.getName());
        if (request.getDepartment() != null) faculty.setDepartment(request.getDepartment());
        if (request.getDesignation() != null) faculty.setDesignation(request.getDesignation());
        if (request.getMobileNumber() != null) faculty.setMobileNumber(request.getMobileNumber());
        if (request.getStatus() != null) faculty.setStatus(request.getStatus());

        return AppDTO.UserResponse.from(userRepository.save(faculty));
    }

    @Override
    @Transactional
    public void toggleFacultyStatus(Long id) {
        User faculty = getFacultyEntity(id);
        faculty.setStatus("ACTIVE".equalsIgnoreCase(faculty.getStatus()) ? "INACTIVE" : "ACTIVE");
        userRepository.save(faculty);
    }
}
