package com.sms.repository;

import com.sms.entity.AcademicCalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AcademicCalendarRepository extends JpaRepository<AcademicCalendarEvent, Long> {

    List<AcademicCalendarEvent> findAllByOrderByStartDateAsc();

    @Query("SELECT e FROM AcademicCalendarEvent e WHERE " +
           "(:from IS NULL OR e.endDate >= :from) AND " +
           "(:to IS NULL OR e.startDate <= :to) " +
           "ORDER BY e.startDate ASC")
    List<AcademicCalendarEvent> findInDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    boolean existsByTitleAndStartDate(String title, LocalDate startDate);
}

