package com.sms.service;

import com.sms.dto.AppDTO;

import java.time.LocalDate;
import java.util.List;

public interface AcademicCalendarService {

    List<AppDTO.AcademicCalendarDTO> getCalendarEvents(LocalDate from, LocalDate to, String type, String audience);

    AppDTO.AcademicCalendarDTO getEventById(Long id);

    AppDTO.AcademicCalendarDTO createEvent(AppDTO.AcademicCalendarDTO req, Long userId);

    AppDTO.AcademicCalendarDTO updateEvent(Long id, AppDTO.AcademicCalendarDTO req, Long userId);

    void deleteEvent(Long id, Long userId);
}

