package com.sms.controller;

import com.sms.dto.AppDTO;
import com.sms.entity.User;
import com.sms.repository.UserRepository;
import com.sms.service.AcademicCalendarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/academic-calendar")
@RequiredArgsConstructor
public class AcademicCalendarController {

    private final AcademicCalendarService calendarService;
    private final UserRepository userRepository;

    private User getUser(UserDetails ud) {
        if (ud == null) return null;
        return userRepository.findByEmail(ud.getUsername()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<List<AppDTO.AcademicCalendarDTO>> getCalendarEvents(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String audience) {
        return ResponseEntity.ok(calendarService.getCalendarEvents(from, to, type, audience));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppDTO.AcademicCalendarDTO> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(calendarService.getEventById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<AppDTO.AcademicCalendarDTO> createEvent(
            @Valid @RequestBody AppDTO.AcademicCalendarDTO req,
            @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        return ResponseEntity.ok(calendarService.createEvent(req, u != null ? u.getId() : null));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<AppDTO.AcademicCalendarDTO> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody AppDTO.AcademicCalendarDTO req,
            @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        return ResponseEntity.ok(calendarService.updateEvent(id, req, u != null ? u.getId() : null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteEvent(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails ud) {
        User u = getUser(ud);
        calendarService.deleteEvent(id, u != null ? u.getId() : null);
        return ResponseEntity.ok(new AppDTO.MessageResponse("Academic calendar event deleted successfully"));
    }
}

