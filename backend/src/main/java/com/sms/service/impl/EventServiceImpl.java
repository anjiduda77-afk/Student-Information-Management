package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.*;
import com.sms.exception.ConflictException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.*;
import com.sms.service.ActivityLogService;
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
    private final EventCoordinatorRepository coordinatorRepository;
    private final ActivityLogService activityLogService;

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

        List<AppDTO.EventCoordinatorDTO> coords = coordinatorRepository.findByEventId(e.getId()).stream()
                .filter(c -> !"REMOVED".equalsIgnoreCase(c.getStatus()))
                .map(this::toCoordinatorDTO)
                .collect(Collectors.toList());

        return AppDTO.EventDTO.builder()
                .id(e.getId())
                .eventCode(e.getEventCode())
                .title(e.getTitle())
                .description(e.getDescription())
                .category(e.getCategory())
                .department(e.getDepartment())
                .posterUrl(e.getPosterUrl())
                .eventDate(e.getEventDate())
                .startTime(e.getStartTime())
                .endTime(e.getEndTime())
                .venue(e.getVenue())
                .organizer(e.getOrganizer())
                .coordinatorId(e.getCoordinator() != null ? e.getCoordinator().getId() : null)
                .coordinatorName(e.getCoordinator() != null ? e.getCoordinator().getName() : null)
                .coordinators(coords)
                .maxParticipants(e.getMaxParticipants())
                .registrationDeadline(e.getRegistrationDeadline())
                .rules(e.getRules())
                .status(e.getStatus().name())
                .participantCount(count)
                .isRegistered(isReg)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    private AppDTO.EventCoordinatorDTO toCoordinatorDTO(EventCoordinator c) {
        User f = c.getFaculty();
        return AppDTO.EventCoordinatorDTO.builder()
                .id(c.getId())
                .eventId(c.getEvent().getId())
                .eventTitle(c.getEvent().getTitle())
                .facultyId(f.getId())
                .facultyName(f.getName())
                .facultyEmail(f.getEmail())
                .facultyDepartment(f.getDepartment() != null ? f.getDepartment() : f.getBranch())
                .facultyDesignation(f.getDesignation() != null ? f.getDesignation() : "Faculty Member")
                .facultyMobile(f.getMobileNumber())
                .assignedByName(c.getAssignedBy() != null ? c.getAssignedBy().getName() : "Administrator")
                .assignedAt(c.getAssignedAt())
                .status(c.getStatus())
                .remarks(c.getRemarks())
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
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));
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
                .department(req.getDepartment())
                .posterUrl(req.getPosterUrl())
                .eventDate(req.getEventDate())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .venue(req.getVenue())
                .organizer(req.getOrganizer() != null ? req.getOrganizer() : "Aditya University Student Council")
                .coordinator(creator)
                .createdBy(creator)
                .maxParticipants(req.getMaxParticipants() != null ? req.getMaxParticipants() : 200)
                .registrationDeadline(req.getRegistrationDeadline() != null ? req.getRegistrationDeadline() : req.getEventDate().atStartOfDay())
                .rules(req.getRules())
                .status(status)
                .build();

        Event saved = eventRepository.save(e);

        if (creator != null) {
            activityLogService.log(creator.getEmail(), creator.getName(), creator.getRole().name(),
                    "CREATE", "EVENTS", "EVENT", String.valueOf(saved.getId()),
                    null, saved.getTitle(), "Published new campus event: " + saved.getTitle());
        }

        return toDTO(saved, creatorId);
    }

    @Override
    @Transactional
    public AppDTO.EventDTO updateEvent(Long eventId, AppDTO.EventDTO req) {
        Event e = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));

        if (req.getTitle() != null) e.setTitle(req.getTitle());
        if (req.getDescription() != null) e.setDescription(req.getDescription());
        if (req.getCategory() != null) e.setCategory(req.getCategory());
        if (req.getDepartment() != null) e.setDepartment(req.getDepartment());
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
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));
        e.setStatus(Event.Status.valueOf(status.toUpperCase()));
        eventRepository.save(e);
    }

    @Override
    @Transactional
    public void deleteEvent(Long eventId, Long adminId) {
        Event e = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));

        // Delete associated coordinators
        List<EventCoordinator> coords = coordinatorRepository.findByEventId(eventId);
        coordinatorRepository.deleteAll(coords);

        // Delete associated registrations
        List<EventRegistration> regs = registrationRepository.findByEventId(eventId);
        registrationRepository.deleteAll(regs);

        // Delete results
        List<EventResult> results = resultRepository.findByEventId(eventId);
        resultRepository.deleteAll(results);

        eventRepository.delete(e);

        if (adminId != null) {
            userRepository.findById(adminId).ifPresent(admin ->
                    activityLogService.log(admin.getEmail(), admin.getName(), admin.getRole().name(),
                            "DELETE", "EVENTS", "EVENT", String.valueOf(eventId),
                            e.getTitle(), null, "Deleted event: " + e.getTitle())
            );
        }
    }

    // ================= Coordinators =================

    @Override
    public List<AppDTO.EventCoordinatorDTO> getEventCoordinators(Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event not found with ID: " + eventId);
        }
        return coordinatorRepository.findByEventId(eventId).stream()
                .filter(c -> !"REMOVED".equalsIgnoreCase(c.getStatus()))
                .map(this::toCoordinatorDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppDTO.EventCoordinatorDTO assignCoordinator(Long eventId, Long facultyId, String remarks, Long adminId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with ID: " + facultyId));

        if (!"ACTIVE".equalsIgnoreCase(faculty.getStatus())) {
            throw new ConflictException("Cannot assign coordinator: Faculty member is not active.");
        }

        // Check if already assigned
        Optional<EventCoordinator> existing = coordinatorRepository.findByEventIdAndFacultyId(eventId, facultyId);
        EventCoordinator coord;
        if (existing.isPresent()) {
            coord = existing.get();
            if ("ACTIVE".equalsIgnoreCase(coord.getStatus())) {
                throw new ConflictException("Faculty member " + faculty.getName() + " is already assigned as an Event Coordinator.");
            }
            coord.setStatus("ACTIVE");
            coord.setRemarks(remarks);
            coord.setAssignedAt(LocalDateTime.now());
        } else {
            User admin = adminId != null ? userRepository.findById(adminId).orElse(null) : null;
            coord = EventCoordinator.builder()
                    .event(event)
                    .faculty(faculty)
                    .assignedBy(admin)
                    .assignedAt(LocalDateTime.now())
                    .status("ACTIVE")
                    .remarks(remarks)
                    .build();
        }

        EventCoordinator saved = coordinatorRepository.save(coord);

        // Audit log
        if (adminId != null) {
            userRepository.findById(adminId).ifPresent(admin ->
                    activityLogService.log(admin.getEmail(), admin.getName(), admin.getRole().name(),
                            "ASSIGN", "EVENTS", "COORDINATOR", String.valueOf(faculty.getId()),
                            null, faculty.getName(), "ADMIN assigned Faculty member " + faculty.getName() + " to " + event.getTitle())
            );
        }

        return toCoordinatorDTO(saved);
    }

    @Override
    @Transactional
    public void removeCoordinator(Long eventId, Long facultyId, Long adminId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with ID: " + facultyId));

        EventCoordinator coord = coordinatorRepository.findByEventIdAndFacultyId(eventId, facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty member is not assigned as coordinator for this event."));

        coordinatorRepository.delete(coord);

        // Audit log
        if (adminId != null) {
            userRepository.findById(adminId).ifPresent(admin ->
                    activityLogService.log(admin.getEmail(), admin.getName(), admin.getRole().name(),
                            "REMOVE", "EVENTS", "COORDINATOR", String.valueOf(faculty.getId()),
                            faculty.getName(), null, "ADMIN removed Faculty member " + faculty.getName() + " from " + event.getTitle())
            );
        }
    }

    @Override
    public boolean isFacultyAssignedToEvent(Long eventId, Long facultyId) {
        if (facultyId == null) return false;
        Event event = eventRepository.findById(eventId).orElse(null);
        if (event == null) return false;
        if (event.getCoordinator() != null && event.getCoordinator().getId().equals(facultyId)) {
            return true;
        }
        return coordinatorRepository.existsByEventIdAndFacultyIdAndStatus(eventId, facultyId, "ACTIVE");
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
                .department(student.getDepartment() != null ? student.getDepartment() : student.getBranch())
                .semester(student.getSemester())
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

        String posStr = request.getPosition().toUpperCase();
        if ("NO_CERTIFICATE".equals(posStr)) {
            resultRepository.findByEventIdAndStudentId(eventId, student.getId())
                    .ifPresent(resultRepository::delete);
            return;
        }

        EventResult.Position pos = EventResult.Position.valueOf(posStr);

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

        if (faculty != null) {
            activityLogService.log(faculty.getEmail(), faculty.getName(), faculty.getRole().name(),
                    "UPDATE", "RESULTS", "EVENT_RESULT", String.valueOf(student.getId()),
                    null, pos.name(), faculty.getName() + " updated result for " + student.getName() + " in " + event.getTitle() + " to " + pos.name());
        }
    }
}
