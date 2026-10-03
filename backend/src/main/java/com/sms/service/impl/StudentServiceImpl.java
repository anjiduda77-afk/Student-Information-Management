package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.dto.AuthDTO;
import com.sms.entity.User;
import com.sms.exception.ConflictException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.UserRepository;
import com.sms.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<AppDTO.UserResponse> getAllStudents(String department, Integer semester) {
        List<User> students = (department != null || semester != null)
                ? userRepository.findStudentsByFilter(department, semester)
                : userRepository.findByRole(User.Role.STUDENT);

        return students.stream()
                .map(AppDTO.UserResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public AppDTO.UserResponse getStudentById(Long id) {
        User user = getStudentEntity(id);
        return AppDTO.UserResponse.from(user);
    }

    @Override
    public User getStudentEntity(Long id) {
        return userRepository.findById(id)
                .filter(u -> u.getRole() == User.Role.STUDENT)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));
    }

    @Override
    @Transactional
    public AppDTO.UserResponse addStudent(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already registered: " + request.getEmail());
        }
        if (request.getStudentId() != null && userRepository.existsByStudentId(request.getStudentId())) {
            throw new ConflictException("Duplicate Student ID: " + request.getStudentId());
        }
        if (request.getRollNumber() != null && userRepository.existsByRollNumber(request.getRollNumber())) {
            throw new ConflictException("Duplicate Roll Number: " + request.getRollNumber());
        }

        // Auto-generate student ID if not provided
        String studentId = request.getStudentId();
        if (studentId == null || studentId.isBlank()) {
            studentId = "STU-" + (request.getAdmissionYear() != null ? request.getAdmissionYear() : "2024") + "-" + String.format("%04d", (int)(Math.random() * 9000 + 1000));
        }

        User student = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword() != null ? request.getPassword() : "Student@123"))
                .role(User.Role.STUDENT)
                .studentId(studentId)
                .rollNumber(request.getRollNumber())
                .branch(request.getBranch())
                .department(request.getDepartment() != null ? request.getDepartment() : request.getBranch())
                .semester(request.getSemester() != null ? request.getSemester() : 1)
                .section(request.getSection() != null ? request.getSection() : "A")
                .admissionYear(request.getAdmissionYear())
                .academicYear(request.getAcademicYear())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .mobileNumber(request.getMobileNumber())
                .address(request.getAddress())
                .status("ACTIVE")
                .build();

        return AppDTO.UserResponse.from(userRepository.save(student));
    }

    @Override
    @Transactional
    public AppDTO.UserResponse updateStudent(Long id, AppDTO.UserResponse request) {
        User student = getStudentEntity(id);

        if (request.getName() != null) student.setName(request.getName());
        if (request.getBranch() != null) student.setBranch(request.getBranch());
        if (request.getDepartment() != null) student.setDepartment(request.getDepartment());
        if (request.getSemester() != null) student.setSemester(request.getSemester());
        if (request.getSection() != null) student.setSection(request.getSection());
        if (request.getMobileNumber() != null) student.setMobileNumber(request.getMobileNumber());
        if (request.getAddress() != null) student.setAddress(request.getAddress());
        if (request.getDateOfBirth() != null) student.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) student.setGender(request.getGender());
        if (request.getStatus() != null) student.setStatus(request.getStatus());

        return AppDTO.UserResponse.from(userRepository.save(student));
    }

    @Override
    @Transactional
    public void toggleStudentStatus(Long id) {
        User student = getStudentEntity(id);
        student.setStatus("ACTIVE".equalsIgnoreCase(student.getStatus()) ? "INACTIVE" : "ACTIVE");
        userRepository.save(student);
    }

    @Override
    @Transactional
    public void deleteStudent(Long id) {
        User student = getStudentEntity(id);
        userRepository.delete(student);
    }
}
