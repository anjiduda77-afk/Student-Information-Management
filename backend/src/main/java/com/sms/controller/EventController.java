package com.sms.controller;

import com.sms.dto.AppDTO;
import com.sms.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<List<AppDTO.EventDTO>> getAll() {
        return ResponseEntity.ok(eventService.getAllEvents(null));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<AppDTO.EventDTO>> getUpcoming() {
        return ResponseEntity.ok(eventService.getUpcomingEvents(null));
    }

    @GetMapping("/completed")
    public ResponseEntity<List<AppDTO.EventDTO>> getCompleted() {
        return ResponseEntity.ok(eventService.getCompletedEvents(null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventById(id, null));
    }
}
