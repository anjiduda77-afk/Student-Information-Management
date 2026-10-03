package com.sms.service;

import com.sms.dto.AppDTO;
import java.util.List;

public interface DepartmentService {
    List<AppDTO.DepartmentDTO> getAllDepartments();
    AppDTO.DepartmentDTO getDepartmentById(Long id);
    AppDTO.DepartmentDTO createDepartment(AppDTO.DepartmentDTO request);
    AppDTO.DepartmentDTO updateDepartment(Long id, AppDTO.DepartmentDTO request);
    void deleteDepartment(Long id);
}
