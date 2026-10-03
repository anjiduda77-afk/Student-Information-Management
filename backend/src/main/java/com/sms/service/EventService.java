package com.sms.service;

import com.sms.dto.AppDTO;
import java.util.List;

public interface EventService {
    List<AppDTO.EventDTO> getAllEvents(Long currentUserId);
    List<AppDTO.EventDTO> getUpcomingEvents(Long currentUserId);
    List<AppDTO.EventDTO> getCompletedEvents(Long currentUserId);
    AppDTO.EventDTO getEventById(Long eventId, Long currentUserId);
    AppDTO.EventDTO createEvent(AppDTO.EventDTO request, Long creatorId);
    AppDTO.EventDTO updateEvent(Long eventId, AppDTO.EventDTO request);
    void updateEventStatus(Long eventId, String status);

    // Registration
    AppDTO.EventParticipantDTO registerStudent(Long eventId, Long studentId);
    void cancelRegistration(Long eventId, Long studentId);
    List<AppDTO.EventParticipantDTO> getEventParticipants(Long eventId);
    List<AppDTO.EventParticipantDTO> getStudentRegistrations(Long studentId);

    // Attendance & Results
    void markParticipantAttendance(Long eventId, Long studentId, String attendanceStatus);
    void recordResult(Long eventId, AppDTO.ResultSubmitRequest request, Long recordedByFacultyId);
}
