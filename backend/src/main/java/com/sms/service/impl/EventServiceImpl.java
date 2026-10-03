package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.Certificate;
import com.sms.entity.Event;
import com.sms.entity.EventRegistration;
import com.sms.entity.EventResult;
import com.sms.entity.User;
import com.sms.exception.ConflictException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import com.sms.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final EventResultRepository resultRepository;
    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;

    private void autoUpdateStatus(Event e) {
        LocalDate today = LocalDate.now();
        if (e.getStatus() == Event.Status.CANCELLED || e.getStatus() == Event.Status.DRAFT) {
            return;
        }

        if (e.getEventDate().isBefore(today)) {
            if (e.getStatus() != Event.Status.COMPLETED) {
                e.setStatus(Event.Status.COMPLETED);
                eventRepository.save(e);
            }
        } else if (e.getRegistrationDeadline() != null && LocalDateTime.now().isAfter(e.getRegistrationDeadline())) {
            if (e.getStatus() == Event.Status.REGISTRATION_OPEN) {
                e.setStatus(Event.Status.REGISTRATION_CLOSED);
                eventRepository.save(e);
            }
        }
    }

    private AppDTO.EventDTO toDTO(Event e, Long currentUserId) {
        autoUpdateStatus(e);
        long count = registrationRepository.countByEventIdAndStatus(e.getId(), EventRegistration.RegistrationStatus.CONFIRMED);
        boolean isReg = false;
        if (currentUserId != null) {
            isReg = registrationRepository.existsByEventIdAndStudentId(e.getId(), currentUserId);
        }

        return AppDTO.EventDTO.builder()
                .id(e.getId())
                .eventCode(e.getEventCode())
                .title(e.getTitle())
                .description(e.getDescription())
                .category(e.getCategory())
                .posterUrl(e.getPosterUrl())
                .eventDate(e.getEventDate())
                .startTime(e.getStartTime())
                .endTime(e.getEndTime())
                .venue(e.getVenue())
                .organizer(e.getOrganizer())
                .coordinatorId(e.getCoordinator() != null ? e.getCoordinator().getId() : null)
                .coordinatorName(e.getCoordinator() != null ? e.getCoordinator().getName() : null)
                .maxParticipants(e.getMaxParticipants())
                .registrationDeadline(e.getRegistrationDeadline())
                .rules(e.getRules())
                .status(e.getStatus().name())
                .participantCount(count)
                .isRegistered(isReg)
                .build();
    }

    @Override
    public List<AppDTO.EventDTO> getAllEvents(Long currentUserId) {
        return eventRepository.findAll().stream()
                .map(e -> toDTO(e, currentUserId))
                .collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.EventDTO> getUpcomingEvents(Long currentUserId) {
        return eventRepository.findUpcomingEvents().stream()
                .map(e -> toDTO(e, currentUserId))
                .collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.EventDTO> getCompletedEvents(Long currentUserId) {
        return eventRepository.findCompletedEvents().stream()
                .map(e -> toDTO(e, currentUserId))
                .collect(Collectors.toList());
    }

    @Override
    public AppDTO.EventDTO getEventById(Long eventId, Long currentUserId) {
        Event e = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        return toDTO(e, currentUserId);
    }

    @Override
    @Transactional
    public AppDTO.EventDTO createEvent(AppDTO.EventDTO req, Long creatorId) {
        User creator = creatorId != null ? userRepository.findById(creatorId).orElse(null) : null;

        Event.Status status = Event.Status.REGISTRATION_OPEN;
        if (req.getStatus() != null) {
            try {
                status = Event.Status.valueOf(req.getStatus().toUpperCase());
            } catch (Exception ignored) {}
        }

        Event e = Event.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .category(req.getCategory() != null ? req.getCategory() : "Technical")
                .posterUrl(req.getPosterUrl())
                .eventDate(req.getEventDate())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .venue(req.getVenue())
                .organizer(req.getOrganizer() != null ? req.getOrganizer() : "Academic Council")
                .coordinator(creator)
                .maxParticipants(req.getMaxParticipants() != null ? req.getMaxParticipants() : 100)
                .registrationDeadline(req.getRegistrationDeadline() != null ? req.getRegistrationDeadline() : req.getEventDate().atStartOfDay())
                .rules(req.getRules())
                .status(status)
                .build();

        return toDTO(eventRepository.save(e), creatorId);
    }

    @Override
    @Transactional
    public AppDTO.EventDTO updateEvent(Long eventId, AppDTO.EventDTO req) {
        Event e = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        if (req.getTitle() != null) e.setTitle(req.getTitle());
        if (req.getDescription() != null) e.setDescription(req.getDescription());
        if (req.getCategory() != null) e.setCategory(req.getCategory());
        if (req.getPosterUrl() != null) e.setPosterUrl(req.getPosterUrl());
        if (req.getEventDate() != null) e.setEventDate(req.getEventDate());
        if (req.getStartTime() != null) e.setStartTime(req.getStartTime());
        if (req.getEndTime() != null) e.setEndTime(req.getEndTime());
        if (req.getVenue() != null) e.setVenue(req.getVenue());
        if (req.getOrganizer() != null) e.setOrganizer(req.getOrganizer());
        if (req.getMaxParticipants() != null) e.setMaxParticipants(req.getMaxParticipants());
        if (req.getRegistrationDeadline() != null) e.setRegistrationDeadline(req.getRegistrationDeadline());
        if (req.getRules() != null) e.setRules(req.getRules());
        if (req.getStatus() != null) {
            try {
                e.setStatus(Event.Status.valueOf(req.getStatus().toUpperCase()));
            } catch (Exception ignored) {}
        }

        return toDTO(eventRepository.save(e), null);
    }

    @Override
    @Transactional
    public void updateEventStatus(Long eventId, String status) {
        Event e = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        e.setStatus(Event.Status.valueOf(status.toUpperCase()));
        eventRepository.save(e);
    }

    // ================= Registration =================

    @Override
    @Transactional
    public AppDTO.EventParticipantDTO registerStudent(Long eventId, Long studentId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        autoUpdateStatus(event);

        if (event.getStatus() == Event.Status.CANCELLED) {
            throw new ConflictException("Registration failed: This event has been cancelled.");
        }
        if (event.getStatus() == Event.Status.COMPLETED) {
            throw new ConflictException("Registration failed: This event has already concluded.");
        }
        if (event.getStatus() == Event.Status.REGISTRATION_CLOSED) {
            throw new ConflictException("Registration is closed for this event.");
        }
        if (event.getRegistrationDeadline() != null && LocalDateTime.now().isAfter(event.getRegistrationDeadline())) {
            throw new ConflictException("Registration deadline has passed on " + event.getRegistrationDeadline());
        }

        if (registrationRepository.existsByEventIdAndStudentId(eventId, studentId)) {
            throw new ConflictException("You are already registered for this event.");
        }

        long currentCount = registrationRepository.countByEventIdAndStatus(eventId, EventRegistration.RegistrationStatus.CONFIRMED);
        if (event.getMaxParticipants() != null && currentCount >= event.getMaxParticipants()) {
            throw new ConflictException("Event registration is full (Capacity: " + event.getMaxParticipants() + ").");
        }

        EventRegistration reg = EventRegistration.builder()
                .event(event)
                .student(student)
                .registeredAt(LocalDateTime.now())
                .status(EventRegistration.RegistrationStatus.CONFIRMED)
                .attendanceStatus(EventRegistration.AttendanceStatus.PENDING)
                .build();

        EventRegistration saved = registrationRepository.save(reg);

        return AppDTO.EventParticipantDTO.builder()
                .id(saved.getId())
                .eventId(event.getId())
                .eventTitle(event.getTitle())
                .studentId(student.getId())
                .studentName(student.getName())
                .rollNumber(student.getRollNumber())
                .registeredAt(saved.getRegisteredAt())
                .registrationStatus(saved.getStatus().name())
                .attendanceStatus(saved.getAttendanceStatus().name())
                .build();
    }

    @Override
    @Transactional
    public void cancelRegistration(Long eventId, Long studentId) {
        EventRegistration reg = registrationRepository.findByEventIdAndStudentId(eventId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found"));
        registrationRepository.delete(reg);
    }

    @Override
    public List<AppDTO.EventParticipantDTO> getEventParticipants(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        return registrationRepository.findByEventId(eventId).stream()
                .map(reg -> {
                    User s = reg.getStudent();
                    Optional<EventResult> res = resultRepository.findByEventIdAndStudentId(eventId, s.getId());
                    Optional<Certificate> cert = certificateRepository.findByStudentIdAndEventId(s.getId(), eventId);

                    return AppDTO.EventParticipantDTO.builder()
                            .id(reg.getId())
                            .eventId(event.getId())
                            .eventTitle(event.getTitle())
                            .studentId(s.getId())
                            .studentName(s.getName())
                            .rollNumber(s.getRollNumber())
                            .department(s.getDepartment() != null ? s.getDepartment() : s.getBranch())
                            .semester(s.getSemester())
                            .registeredAt(reg.getRegisteredAt())
                            .registrationStatus(reg.getStatus().name())
                            .attendanceStatus(reg.getAttendanceStatus().name())
                            .resultPosition(res.map(r -> r.getPosition().name()).orElse(null))
                            .certificateId(cert.map(Certificate::getCertificateId).orElse(null))
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.EventParticipantDTO> getStudentRegistrations(Long studentId) {
        return registrationRepository.findByStudentId(studentId).stream()
                .map(reg -> {
                    Event event = reg.getEvent();
                    Optional<EventResult> res = resultRepository.findByEventIdAndStudentId(event.getId(), studentId);
                    Optional<Certificate> cert = certificateRepository.findByStudentIdAndEventId(studentId, event.getId());

                    return AppDTO.EventParticipantDTO.builder()
                            .id(reg.getId())
                            .eventId(event.getId())
                            .eventTitle(event.getTitle())
                            .studentId(studentId)
                            .registeredAt(reg.getRegisteredAt())
                            .registrationStatus(reg.getStatus().name())
                            .attendanceStatus(reg.getAttendanceStatus().name())
                            .resultPosition(res.map(r -> r.getPosition().name()).orElse(null))
                            .certificateId(cert.map(Certificate::getCertificateId).orElse(null))
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ================= Attendance & Results =================

    @Override
    @Transactional
    public void markParticipantAttendance(Long eventId, Long studentId, String attendanceStatus) {
        EventRegistration reg = registrationRepository.findByEventIdAndStudentId(eventId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant registration not found"));
        reg.setAttendanceStatus(EventRegistration.AttendanceStatus.valueOf(attendanceStatus.toUpperCase()));
        registrationRepository.save(reg);
    }

    @Override
    @Transactional
    public void recordResult(Long eventId, AppDTO.ResultSubmitRequest request, Long recordedByFacultyId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        User faculty = recordedByFacultyId != null ? userRepository.findById(recordedByFacultyId).orElse(null) : null;

        EventResult.Position pos = EventResult.Position.valueOf(request.getPosition().toUpperCase());

        Optional<EventResult> existing = resultRepository.findByEventIdAndStudentId(eventId, student.getId());
        EventResult result;
        if (existing.isPresent()) {
            result = existing.get();
            result.setPosition(pos);
            result.setScore(request.getScore());
            result.setRemarks(request.getRemarks());
            result.setRecordedBy(faculty);
        } else {
            result = EventResult.builder()
                    .event(event)
                    .student(student)
                    .position(pos)
                    .score(request.getScore())
                    .remarks(request.getRemarks())
                    .recordedBy(faculty)
                    .recordedAt(LocalDateTime.now())
                    .build();
        }

        resultRepository.save(result);
    }
}
