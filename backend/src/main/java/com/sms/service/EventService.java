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
    void deleteEvent(Long eventId, Long adminId);

    // Coordinators
    List<AppDTO.EventCoordinatorDTO> getEventCoordinators(Long eventId);
    AppDTO.EventCoordinatorDTO assignCoordinator(Long eventId, Long facultyId, String remarks, Long adminId);
    void removeCoordinator(Long eventId, Long facultyId, Long adminId);
    boolean isFacultyAssignedToEvent(Long eventId, Long facultyId);

    // Registration
    AppDTO.EventParticipantDTO registerStudent(Long eventId, Long studentId);
    void cancelRegistration(Long eventId, Long studentId);
    List<AppDTO.EventParticipantDTO> getEventParticipants(Long eventId);
    List<AppDTO.EventParticipantDTO> getStudentRegistrations(Long studentId);

    // Attendance & Results
    void markParticipantAttendance(Long eventId, Long studentId, String attendanceStatus);
    void recordResult(Long eventId, AppDTO.ResultSubmitRequest request, Long recordedByFacultyId);
}
