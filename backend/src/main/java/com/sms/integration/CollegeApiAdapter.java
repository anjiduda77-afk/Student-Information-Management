package com.sms.integration;

import java.util.Map;

/**
 * Interface adapter for official university / college ERP REST API integration.
 * In production, this client authenticates with the university SIS gateway
 * using authorized institutional API keys and OAuth2 client credentials.
 */
public interface CollegeApiAdapter {

    boolean isConnected();

    Map<String, Object> syncStudentProfile(String studentId);

    Map<String, Object> syncFacultyProfile(String facultyId);

    Map<String, Object> fetchExternalAttendanceRecords(String rollNumber, String semester);

    Map<String, Object> fetchExternalMarks(String rollNumber, String examSession);

    Map<String, Object> fetchMasterTimetable(String departmentCode, String academicYear);

    Map<String, Object> getSystemHealth();
}
