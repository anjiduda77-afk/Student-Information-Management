package com.sms.repository;

import com.sms.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {
    Optional<Event> findByEventCode(String eventCode);
    List<Event> findByStatus(Event.Status status);
    List<Event> findByCoordinatorId(Long coordinatorId);

    @Query("SELECT e FROM Event e WHERE e.status IN ('PUBLISHED', 'REGISTRATION_OPEN', 'ONGOING') ORDER BY e.eventDate ASC")
    List<Event> findUpcomingEvents();

    @Query("SELECT e FROM Event e WHERE e.status = 'COMPLETED' ORDER BY e.eventDate DESC")
    List<Event> findCompletedEvents();

    @Query("SELECT e FROM Event e WHERE e.status <> 'COMPLETED' AND e.eventDate < :today")
    List<Event> findEventsPastDate(@Param("today") LocalDate today);
}
