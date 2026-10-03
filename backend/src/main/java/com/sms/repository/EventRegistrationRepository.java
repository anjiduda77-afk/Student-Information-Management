package com.sms.repository;

import com.sms.entity.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {
    List<EventRegistration> findByEventId(Long eventId);
    List<EventRegistration> findByStudentId(Long studentId);
    Optional<EventRegistration> findByEventIdAndStudentId(Long eventId, Long studentId);
    boolean existsByEventIdAndStudentId(Long eventId, Long studentId);
    long countByEventIdAndStatus(Long eventId, EventRegistration.RegistrationStatus status);
}
