package com.sms.config;

import com.sms.entity.Event;
import com.sms.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final EventRepository eventRepository;

    /**
     * Runs every hour. Automatically transitions event statuses based on date/time.
     */
    @Scheduled(fixedDelay = 3600000) // every 60 minutes
    @Transactional
    public void updateEventStatuses() {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        List<Event> events = eventRepository.findAll();
        int updated = 0;

        for (Event e : events) {
            if (e.getStatus() == Event.Status.CANCELLED || e.getStatus() == Event.Status.DRAFT) {
                continue;
            }

            // Auto-complete past events
            if (e.getEventDate().isBefore(today) && e.getStatus() != Event.Status.COMPLETED) {
                e.setStatus(Event.Status.COMPLETED);
                updated++;
                log.info("Auto-completed event: {} (ID: {})", e.getTitle(), e.getId());
            }
            // Auto-close registration after deadline
            else if (e.getRegistrationDeadline() != null && now.isAfter(e.getRegistrationDeadline())
                    && e.getStatus() == Event.Status.REGISTRATION_OPEN) {
                e.setStatus(Event.Status.REGISTRATION_CLOSED);
                updated++;
                log.info("Auto-closed registration for: {} (ID: {})", e.getTitle(), e.getId());
            }
        }

        if (updated > 0) {
            eventRepository.saveAll(events);
            log.info("Auto-updated {} event status(es)", updated);
        }
    }
}
