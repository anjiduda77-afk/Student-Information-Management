package com.sms.service;

import com.sms.dto.AppDTO;
import java.util.List;

public interface TimetableService {
    List<AppDTO.TimetableDTO> getAllTimetables();
    List<AppDTO.TimetableDTO> getWeeklySchedule(Long courseId, Integer semester, String section);
    List<AppDTO.TimetableDTO> getFacultySchedule(Long facultyId);
    List<AppDTO.TimetableDTO> getStudentSchedule(Long studentId);
    AppDTO.TimetableDTO createTimetable(AppDTO.TimetableDTO request);
    AppDTO.TimetableDTO updateTimetable(Long id, AppDTO.TimetableDTO request);
    void deleteTimetable(Long id);
}
