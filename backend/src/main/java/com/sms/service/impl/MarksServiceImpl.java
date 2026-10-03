package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.Course;
import com.sms.entity.Marks;
import com.sms.entity.User;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.CourseRepository;
import com.sms.repository.MarksRepository;
import com.sms.repository.UserRepository;
import com.sms.service.MarksService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarksServiceImpl implements MarksService {

    private final MarksRepository marksRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private Marks.ExamType parseExamType(String str) {
        if (str == null) return Marks.ExamType.MIDTERM;
        try {
            return Marks.ExamType.valueOf(str.toUpperCase());
        } catch (Exception e) {
            return Marks.ExamType.MIDTERM;
        }
    }

    @Override
    @Transactional
    public AppDTO.MarksResponse uploadMarks(AppDTO.MarksRequest req) {
        User student = userRepository.findById(req.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        Course course = courseRepository.findById(req.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        Marks.ExamType examType = parseExamType(req.getExamType());

        // Check if marks already exist for this student, course, and exam
        List<Marks> existing = marksRepository.findByStudentIdAndCourseId(student.getId(), course.getId());
        Optional<Marks> match = existing.stream().filter(m -> m.getExamType() == examType).findFirst();

        Marks marks;
        if (match.isPresent()) {
            marks = match.get();
            marks.setMarksObtained(req.getMarksObtained());
            marks.setTotalMarks(req.getTotalMarks());
            marks.setUploadedAt(LocalDateTime.now());
        } else {
            marks = Marks.builder()
                    .student(student)
                    .course(course)
                    .examType(examType)
                    .marksObtained(req.getMarksObtained())
                    .totalMarks(req.getTotalMarks())
                    .uploadedAt(LocalDateTime.now())
                    .build();
        }

        Marks saved = marksRepository.save(marks);

        // Instant notification to student via WebSocket
        try {
            AppDTO.Notification notification = AppDTO.Notification.builder()
                    .type("GRADE_UPDATE")
                    .message("Grade published for " + course.getName() + " (" + examType + ")")
                    .courseName(course.getName())
                    .grade(saved.getGrade())
                    .build();

            messagingTemplate.convertAndSendToUser(
                    student.getEmail(), "/queue/notifications", notification
            );
        } catch (Exception ignored) {}

        return AppDTO.MarksResponse.from(saved);
    }

    @Override
    @Transactional
    public List<AppDTO.MarksResponse> uploadBatchMarks(Long courseId, String examType, Double totalMarks, List<AppDTO.MarksRequest> list) {
        List<AppDTO.MarksResponse> results = new ArrayList<>();
        for (AppDTO.MarksRequest req : list) {
            req.setCourseId(courseId);
            req.setExamType(examType);
            req.setTotalMarks(totalMarks);
            results.add(uploadMarks(req));
        }
        return results;
    }

    @Override
    public List<AppDTO.MarksResponse> getStudentMarks(Long studentId) {
        return marksRepository.findByStudentId(studentId).stream()
                .map(AppDTO.MarksResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.MarksResponse> getCourseMarks(Long courseId) {
        return marksRepository.findByCourseId(courseId).stream()
                .map(AppDTO.MarksResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getStudentPerformanceSummary(Long studentId) {
        List<Marks> marks = marksRepository.findByStudentId(studentId);
        if (marks.isEmpty()) {
            return Map.of(
                    "overallAverage", 0.0,
                    "totalExams", 0,
                    "estimatedCgpa", 0.0,
                    "highestGrade", "N/A"
            );
        }

        double totalPct = 0;
        for (Marks m : marks) {
            totalPct += (m.getMarksObtained() / m.getTotalMarks()) * 100;
        }
        double avg = Math.round((totalPct / marks.size()) * 10.0) / 10.0;
        double cgpa = Math.round((avg / 9.5) * 100.0) / 100.0; // Standard Indian university percentage to 10-point CGPA conversion formula

        return Map.of(
                "overallAverage", avg,
                "totalExams", marks.size(),
                "estimatedCgpa", cgpa,
                "highestGrade", marks.stream().map(Marks::getGrade).sorted().findFirst().orElse("A")
        );
    }
}
