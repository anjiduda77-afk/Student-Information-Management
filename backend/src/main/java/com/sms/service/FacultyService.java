package com.sms.service;

import com.sms.dto.AppDTO;
import com.sms.dto.AuthDTO;
import com.sms.entity.User;

import java.util.List;

public interface FacultyService {
    List<AppDTO.UserResponse> getAllFaculty();
    AppDTO.UserResponse getFacultyById(Long id);
    AppDTO.UserResponse addFaculty(AuthDTO.RegisterRequest request);
    AppDTO.UserResponse updateFaculty(Long id, AppDTO.UserResponse request);
    void toggleFacultyStatus(Long id);
    User getFacultyEntity(Long id);
}
