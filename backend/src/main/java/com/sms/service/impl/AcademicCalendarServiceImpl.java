package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.AcademicCalendarEvent;
import com.sms.entity.User;
import com.sms.exception.ConflictException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.AcademicCalendarRepository;
import com.sms.repository.UserRepository;
import com.sms.service.AcademicCalendarService;
import com.sms.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AcademicCalendarServiceImpl implements AcademicCalendarService {

    private final AcademicCalendarRepository calendarRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    private AppDTO.AcademicCalendarDTO toDTO(AcademicCalendarEvent e) {
        return AppDTO.AcademicCalendarDTO.builder()
                .id(e.getId())
                .title(e.getTitle())
                .description(e.getDescription())
                .eventType(e.getEventType() != null ? e.getEventType().name() : "GENERAL")
                .startDate(e.getStartDate())
                .endDate(e.getEndDate() != null ? e.getEndDate() : e.getStartDate())
                .startTime(e.getStartTime())
                .endTime(e.getEndTime())
                .venue(e.getVenue())
                .targetAudience(e.getTargetAudience() != null ? e.getTargetAudience() : "ALL")
                .semester(e.getSemester())
                .isHoliday(e.getIsHoliday() != null ? e.getIsHoliday() : false)
                .linkedEventId(e.getLinkedEventId())
                .creatorName(e.getCreatedBy() != null ? e.getCreatedBy().getName() : "Academic Administration")
                .createdAt(e.getCreatedAt())
                .build();
    }

    private void validate(AppDTO.AcademicCalendarDTO req) {
        if (req.getTitle() == null || req.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Calendar event title is required.");
        }
        if (req.getStartDate() == null) {
            throw new IllegalArgumentException("Start date is required.");
        }
        if (req.getEndDate() != null && req.getEndDate().isBefore(req.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be earlier than start date.");
        }
        if (req.getStartTime() != null && req.getEndTime() != null && !req.getStartTime().isBefore(req.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }
    }

    @Override
    public List<AppDTO.AcademicCalendarDTO> getCalendarEvents(LocalDate from, LocalDate to, String type, String audience) {
        List<AcademicCalendarEvent> events;
        if (from != null || to != null) {
            events = calendarRepository.findInDateRange(from, to);
        } else {
            events = calendarRepository.findAllByOrderByStartDateAsc();
        }

        return events.stream()
                .filter(e -> {
                    if (type != null && !type.equalsIgnoreCase("ALL")) {
                        if (!e.getEventType().name().equalsIgnoreCase(type)) {
                            return false;
                        }
                    }
                    if (audience != null && !audience.equalsIgnoreCase("ALL")) {
                        if (e.getTargetAudience() != null &&
                                !e.getTargetAudience().equalsIgnoreCase("ALL") &&
                                !e.getTargetAudience().equalsIgnoreCase(audience)) {
                            return false;
                        }
                    }
                    return true;
                })
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public AppDTO.AcademicCalendarDTO getEventById(Long id) {
        AcademicCalendarEvent event = calendarRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic calendar entry not found with ID: " + id));
        return toDTO(event);
    }

    @Override
    @Transactional
    public AppDTO.AcademicCalendarDTO createEvent(AppDTO.AcademicCalendarDTO req, Long userId) {
        validate(req);

        if (calendarRepository.existsByTitleAndStartDate(req.getTitle().trim(), req.getStartDate())) {
            throw new ConflictException("An academic calendar entry with the title '" + req.getTitle().trim() +
                    "' on " + req.getStartDate() + " already exists.");
        }

        User creator = userId != null ? userRepository.findById(userId).orElse(null) : null;

        AcademicCalendarEvent.EventType eventType = AcademicCalendarEvent.EventType.GENERAL;
        if (req.getEventType() != null) {
            try {
                eventType = AcademicCalendarEvent.EventType.valueOf(req.getEventType().toUpperCase());
            } catch (Exception ignored) {}
        }

        boolean isHoliday = Boolean.TRUE.equals(req.getIsHoliday()) || eventType == AcademicCalendarEvent.EventType.HOLIDAY;
        LocalDate endDate = req.getEndDate() != null ? req.getEndDate() : req.getStartDate();

        AcademicCalendarEvent event = AcademicCalendarEvent.builder()
                .title(req.getTitle().trim())
                .description(req.getDescription())
                .eventType(eventType)
                .startDate(req.getStartDate())
                .endDate(endDate)
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .venue(req.getVenue())
                .targetAudience(req.getTargetAudience() != null ? req.getTargetAudience() : "ALL")
                .semester(req.getSemester())
                .isHoliday(isHoliday)
                .linkedEventId(req.getLinkedEventId())
                .createdBy(creator)
                .build();

        AcademicCalendarEvent saved = calendarRepository.save(event);

        if (creator != null) {
            activityLogService.log(creator.getEmail(), creator.getName(), creator.getRole().name(),
                    "CREATE", "ACADEMIC_CALENDAR", "CALENDAR_EVENT", String.valueOf(saved.getId()),
                    null, saved.getTitle(), "Created academic calendar entry: " + saved.getTitle());
        }

        return toDTO(saved);
    }

    @Override
    @Transactional
    public AppDTO.AcademicCalendarDTO updateEvent(Long id, AppDTO.AcademicCalendarDTO req, Long userId) {
        validate(req);

        AcademicCalendarEvent event = calendarRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic calendar entry not found with ID: " + id));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        if (req.getTitle() != null) event.setTitle(req.getTitle().trim());
        if (req.getDescription() != null) event.setDescription(req.getDescription());
        if (req.getEventType() != null) {
            try {
                event.setEventType(AcademicCalendarEvent.EventType.valueOf(req.getEventType().toUpperCase()));
            } catch (Exception ignored) {}
        }
        if (req.getStartDate() != null) event.setStartDate(req.getStartDate());
        if (req.getEndDate() != null) event.setEndDate(req.getEndDate());
        else if (req.getStartDate() != null) event.setEndDate(req.getStartDate());
        if (req.getStartTime() != null) event.setStartTime(req.getStartTime());
        if (req.getEndTime() != null) event.setEndTime(req.getEndTime());
        if (req.getVenue() != null) event.setVenue(req.getVenue());
        if (req.getTargetAudience() != null) event.setTargetAudience(req.getTargetAudience());
        if (req.getSemester() != null) event.setSemester(req.getSemester());
        if (req.getIsHoliday() != null) {
            event.setIsHoliday(req.getIsHoliday());
        } else if (event.getEventType() == AcademicCalendarEvent.EventType.HOLIDAY) {
            event.setIsHoliday(true);
        }
        if (req.getLinkedEventId() != null) event.setLinkedEventId(req.getLinkedEventId());

        AcademicCalendarEvent saved = calendarRepository.save(event);

        if (user != null) {
            activityLogService.log(user.getEmail(), user.getName(), user.getRole().name(),
                    "UPDATE", "ACADEMIC_CALENDAR", "CALENDAR_EVENT", String.valueOf(saved.getId()),
                    null, saved.getTitle(), "Updated academic calendar entry: " + saved.getTitle());
        }

        return toDTO(saved);
    }

    @Override
    @Transactional
    public void deleteEvent(Long id, Long userId) {
        AcademicCalendarEvent event = calendarRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic calendar entry not found with ID: " + id));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        calendarRepository.delete(event);

        if (user != null) {
            activityLogService.log(user.getEmail(), user.getName(), user.getRole().name(),
                    "DELETE", "ACADEMIC_CALENDAR", "CALENDAR_EVENT", String.valueOf(id),
                    event.getTitle(), null, "Removed academic calendar entry: " + event.getTitle());
        }
    }
}

