package com.sms.repository;

import com.sms.entity.EventCoordinator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventCoordinatorRepository extends JpaRepository<EventCoordinator, Long> {

    List<EventCoordinator> findByEventId(Long eventId);

    List<EventCoordinator> findByEventIdAndStatus(Long eventId, String status);

    List<EventCoordinator> findByFacultyId(Long facultyId);

    List<EventCoordinator> findByFacultyIdAndStatus(Long facultyId, String status);

    Optional<EventCoordinator> findByEventIdAndFacultyId(Long eventId, Long facultyId);

    boolean existsByEventIdAndFacultyId(Long eventId, Long facultyId);

    boolean existsByEventIdAndFacultyIdAndStatus(Long eventId, Long facultyId, String status);

    void deleteByEventIdAndFacultyId(Long eventId, Long facultyId);
}
