package com.sms.service;

import com.sms.dto.AppDTO;
import com.sms.dto.AuthDTO;
import com.sms.entity.User;

import java.util.List;

public interface StudentService {
    List<AppDTO.UserResponse> getAllStudents(String department, Integer semester);
    AppDTO.UserResponse getStudentById(Long id);
    AppDTO.UserResponse addStudent(AuthDTO.RegisterRequest request);
    AppDTO.UserResponse updateStudent(Long id, AppDTO.UserResponse request);
    void toggleStudentStatus(Long id);
    void deleteStudent(Long id);
    User getStudentEntity(Long id);
}
