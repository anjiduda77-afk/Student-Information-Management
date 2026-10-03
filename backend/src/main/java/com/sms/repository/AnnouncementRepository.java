package com.sms.repository;

import com.sms.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByActiveTrueOrderByCreatedAtDesc();

    @Query("SELECT a FROM Announcement a WHERE a.active = true " +
           "AND (a.startDate IS NULL OR a.startDate <= :today) " +
           "AND (a.endDate IS NULL OR a.endDate >= :today) " +
           "AND (a.targetRole = 'ALL' OR a.targetRole = :role) " +
           "ORDER BY a.createdAt DESC")
    List<Announcement> findActiveForRole(@Param("role") String role, @Param("today") LocalDate today);
}
