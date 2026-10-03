package com.sms.repository;

import com.sms.entity.EventResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EventResultRepository extends JpaRepository<EventResult, Long> {
    List<EventResult> findByEventId(Long eventId);
    List<EventResult> findByStudentId(Long studentId);
    Optional<EventResult> findByEventIdAndStudentId(Long eventId, Long studentId);
    boolean existsByEventIdAndStudentId(Long eventId, Long studentId);
}
