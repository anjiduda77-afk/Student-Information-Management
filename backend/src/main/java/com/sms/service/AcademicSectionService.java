package com.sms.service;

import com.sms.dto.AppDTO;

import java.util.List;

public interface AcademicSectionService {
    List<AppDTO.AcademicSectionResponse> getSections(Long departmentId, Integer semester, String academicYear);
    AppDTO.AcademicSectionResponse getSectionById(Long id);
    AppDTO.AcademicSectionResponse createSection(AppDTO.AcademicSectionRequest request);
    AppDTO.AcademicSectionResponse updateSection(Long id, AppDTO.AcademicSectionRequest request);
    void deleteSection(Long id);
}
