package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.Department;
import com.sms.entity.User;
import com.sms.exception.ConflictException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.DepartmentRepository;
import com.sms.repository.UserRepository;
import com.sms.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @Override
    public List<AppDTO.DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(d -> {
                    long students = userRepository.findByRole(User.Role.STUDENT).stream()
                            .filter(s -> d.getName().equalsIgnoreCase(s.getDepartment()) || d.getCode().equalsIgnoreCase(s.getBranch()) || d.getCode().equalsIgnoreCase(s.getDepartment()))
                            .count();
                    long faculty = userRepository.findByRole(User.Role.FACULTY).stream()
                            .filter(f -> d.getName().equalsIgnoreCase(f.getDepartment()) || d.getCode().equalsIgnoreCase(f.getDepartment()))
                            .count();

                    return AppDTO.DepartmentDTO.builder()
                            .id(d.getId())
                            .code(d.getCode())
                            .name(d.getName())
                            .headOfDepartment(d.getHeadOfDepartment())
                            .description(d.getDescription())
                            .status(d.getStatus())
                            .studentCount(students)
                            .facultyCount(faculty)
                            .build();
                }).collect(Collectors.toList());
    }

    @Override
    public AppDTO.DepartmentDTO getDepartmentById(Long id) {
        Department d = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));
        return AppDTO.DepartmentDTO.builder()
                .id(d.getId())
                .code(d.getCode())
                .name(d.getName())
                .headOfDepartment(d.getHeadOfDepartment())
                .description(d.getDescription())
                .status(d.getStatus())
                .build();
    }

    @Override
    @Transactional
    public AppDTO.DepartmentDTO createDepartment(AppDTO.DepartmentDTO request) {
        if (departmentRepository.existsByCode(request.getCode().trim().toUpperCase())) {
            throw new ConflictException("Department code already exists: " + request.getCode());
        }

        Department d = Department.builder()
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName())
                .headOfDepartment(request.getHeadOfDepartment())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        Department saved = departmentRepository.save(d);
        return getDepartmentById(saved.getId());
    }

    @Override
    @Transactional
    public AppDTO.DepartmentDTO updateDepartment(Long id, AppDTO.DepartmentDTO request) {
        Department d = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));

        if (request.getName() != null) d.setName(request.getName());
        if (request.getHeadOfDepartment() != null) d.setHeadOfDepartment(request.getHeadOfDepartment());
        if (request.getDescription() != null) d.setDescription(request.getDescription());
        if (request.getStatus() != null) d.setStatus(request.getStatus());

        return getDepartmentById(d.getId());
    }

    @Override
    @Transactional
    public void deleteDepartment(Long id) {
        Department d = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));
        departmentRepository.delete(d);
    }
}
