package com.sms.controller;

import com.sms.dto.AppDTO;
import com.sms.entity.User;
import com.sms.repository.UserRepository;
import com.sms.service.CertificateService;
import com.sms.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final CertificateService certificateService;
    private final UserRepository userRepository;

    private User getUser(UserDetails ud) {
        if (ud == null) return null;
        return userRepository.findByEmail(ud.getUsername()).orElse(null);
    }

    private void checkEventManagementPermission(Long eventId, User user) {
        if (user == null) {
            throw new AccessDeniedException("Authentication required.");
        }
        if (user.getRole() == User.Role.ADMIN) {
            return; // Admin has full access
        }
        if (user.getRole() == User.Role.FACULTY) {
            boolean isAssigned = eventService.isFacultyAssignedToEvent(eventId, user.getId());
            if (!isAssigned) {
                throw new AccessDeniedException("You do not have permission to manage this event. Only assigned coordinators may manage event details.");
            }
            return;
        }
        throw new AccessDeniedException("Access denied for role: " + user.getRole());
    }

    // ==================== Events CRUD ====================

    @GetMapping
    public ResponseEntity<List<AppDTO.EventDTO>> getAll(@AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        return ResponseEntity.ok(eventService.getAllEvents(u != null ? u.getId() : null));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<AppDTO.EventDTO>> getUpcoming(@AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        return ResponseEntity.ok(eventService.getUpcomingEvents(u != null ? u.getId() : null));
    }

    @GetMapping("/completed")
    public ResponseEntity<List<AppDTO.EventDTO>> getCompleted(@AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        return ResponseEntity.ok(eventService.getCompletedEvents(u != null ? u.getId() : null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id, @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        return ResponseEntity.ok(eventService.getEventById(id, u != null ? u.getId() : null));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createEvent(@Valid @RequestBody AppDTO.EventDTO req,
                                         @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        return ResponseEntity.ok(eventService.createEvent(req, u != null ? u.getId() : null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id,
                                         @Valid @RequestBody AppDTO.EventDTO req,
                                         @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        checkEventManagementPermission(id, u);
        return ResponseEntity.ok(eventService.updateEvent(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id,
                                         @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        eventService.deleteEvent(id, u != null ? u.getId() : null);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Event deleted successfully"));
    }

    // ==================== Coordinators (ADMIN ONLY) ====================

    @GetMapping("/{eventId}/coordinators")
    public ResponseEntity<List<AppDTO.EventCoordinatorDTO>> getCoordinators(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.getEventCoordinators(eventId));
    }

    @PostMapping("/{eventId}/coordinators")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignCoordinator(@PathVariable Long eventId,
                                               @Valid @RequestBody AppDTO.AssignCoordinatorRequest req,
                                               @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        AppDTO.EventCoordinatorDTO assigned = eventService.assignCoordinator(
                eventId, req.getFacultyId(), req.getRemarks(), u != null ? u.getId() : null);
        return ResponseEntity.ok(assigned);
    }

    @DeleteMapping("/{eventId}/coordinators/{facultyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> removeCoordinator(@PathVariable Long eventId,
                                               @PathVariable Long facultyId,
                                               @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        eventService.removeCoordinator(eventId, facultyId, u != null ? u.getId() : null);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Faculty coordinator removed successfully"));
    }

    // ==================== Participants ====================

    @GetMapping("/{eventId}/participants")
    public ResponseEntity<List<AppDTO.EventParticipantDTO>> getParticipants(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.getEventParticipants(eventId));
    }

    @PostMapping("/{eventId}/participants/{studentId}")
    public ResponseEntity<?> registerParticipant(@PathVariable Long eventId,
                                                 @PathVariable Long studentId,
                                                 @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        // Only self (student) or staff/admin can register
        if (u != null && u.getRole() == User.Role.STUDENT && !u.getId().equals(studentId)) {
            throw new AccessDeniedException("Students can only register themselves.");
        }
        return ResponseEntity.ok(eventService.registerStudent(eventId, studentId));
    }

    @DeleteMapping("/{eventId}/participants/{studentId}")
    public ResponseEntity<?> cancelParticipant(@PathVariable Long eventId,
                                               @PathVariable Long studentId,
                                               @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        if (u != null && u.getRole() == User.Role.STUDENT && !u.getId().equals(studentId)) {
            throw new AccessDeniedException("Students can only cancel their own registration.");
        }
        eventService.cancelRegistration(eventId, studentId);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Participant registration cancelled"));
    }

    @PatchMapping("/{eventId}/participants/{studentId}/attendance")
    public ResponseEntity<?> markAttendance(@PathVariable Long eventId,
                                            @PathVariable Long studentId,
                                            @RequestParam String status,
                                            @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        checkEventManagementPermission(eventId, u);
        eventService.markParticipantAttendance(eventId, studentId, status);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Attendance marked successfully"));
    }

    // ==================== Results ====================

    @GetMapping("/{eventId}/results")
    public ResponseEntity<List<AppDTO.EventParticipantDTO>> getResults(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.getEventParticipants(eventId));
    }

    @PutMapping("/{eventId}/results/{studentId}")
    public ResponseEntity<?> updateResult(@PathVariable Long eventId,
                                          @PathVariable Long studentId,
                                          @Valid @RequestBody AppDTO.ResultSubmitRequest req,
                                          @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        checkEventManagementPermission(eventId, u);
        req.setStudentId(studentId);
        eventService.recordResult(eventId, req, u != null ? u.getId() : null);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Student result recorded successfully"));
    }

    // ==================== Certificates for Event ====================

    @GetMapping("/{eventId}/certificates")
    public ResponseEntity<List<AppDTO.CertificateDTO>> getEventCertificates(@PathVariable Long eventId) {
        return ResponseEntity.ok(certificateService.getCertificatesByEvent(eventId));
    }

    @PostMapping("/{eventId}/certificates/generate")
    public ResponseEntity<?> generateCertificate(@PathVariable Long eventId,
                                                 @Valid @RequestBody AppDTO.GenerateCertificateRequest req,
                                                 @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        checkEventManagementPermission(eventId, u);
        req.setEventId(eventId);
        return ResponseEntity.ok(certificateService.generateCertificate(req, u != null ? u.getId() : null));
    }
}
