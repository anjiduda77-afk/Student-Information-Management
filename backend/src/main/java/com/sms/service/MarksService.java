package com.sms.service;

import com.sms.dto.AppDTO;
import java.util.List;
import java.util.Map;

public interface MarksService {
    AppDTO.MarksResponse uploadMarks(AppDTO.MarksRequest request);
    List<AppDTO.MarksResponse> uploadBatchMarks(Long courseId, String examType, Double totalMarks, List<AppDTO.MarksRequest> list);
    List<AppDTO.MarksResponse> getStudentMarks(Long studentId);
    List<AppDTO.MarksResponse> getCourseMarks(Long courseId);
    Map<String, Object> getStudentPerformanceSummary(Long studentId);
}
