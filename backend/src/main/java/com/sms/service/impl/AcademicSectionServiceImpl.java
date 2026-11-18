package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.AcademicSection;
import com.sms.entity.Department;
import com.sms.entity.User;
import com.sms.exception.ConflictException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.AcademicSectionRepository;
import com.sms.repository.DepartmentRepository;
import com.sms.repository.UserRepository;
import com.sms.service.AcademicSectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AcademicSectionServiceImpl implements AcademicSectionService {

    private final AcademicSectionRepository academicSectionRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public List<AppDTO.AcademicSectionResponse> getSections(Long departmentId, Integer semester, String academicYear) {
        if (academicSectionRepository.count() == 0) {
            seedDefaultSections();
        }

        List<AcademicSection> sections = academicSectionRepository.findByFilters(departmentId, semester, academicYear);

        return sections.stream().map(sec -> {
            int enrolled = countEnrolledStudents(sec);
            return AppDTO.AcademicSectionResponse.from(sec, enrolled);
        }).collect(Collectors.toList());
    }

    private int countEnrolledStudents(AcademicSection sec) {
        try {
            String deptName = sec.getDepartment() != null ? sec.getDepartment().getName() : null;
            Integer sem = sec.getSemester();
            String secName = sec.getSectionName();
            if (deptName == null && sec.getDepartment() != null) {
                deptName = sec.getDepartment().getCode();
            }
            List<User> list = userRepository.findStudentsForBulkAssignment(deptName, sem, secName);
            return list != null ? list.size() : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    @Override
    public AppDTO.AcademicSectionResponse getSectionById(Long id) {
        AcademicSection sec = academicSectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic Section not found with ID: " + id));
        int enrolled = countEnrolledStudents(sec);
        return AppDTO.AcademicSectionResponse.from(sec, enrolled);
    }

    @Override
    @Transactional
    public AppDTO.AcademicSectionResponse createSection(AppDTO.AcademicSectionRequest request) {
        Department dept = null;
        if (request.getDepartmentId() != null) {
            dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
        }

        String secName = request.getSectionName().trim().toUpperCase();
        Integer sem = request.getSemester();
        String deptCode = dept != null && dept.getCode() != null ? dept.getCode().toUpperCase() : "SEC";

        String code = request.getCode();
        if (code == null || code.trim().isEmpty()) {
            code = deptCode + "-" + sem + secName;
        } else {
            code = code.trim().toUpperCase();
        }

        if (academicSectionRepository.existsByCode(code)) {
            throw new ConflictException("A section with code '" + code + "' already exists.");
        }

        User advisor = null;
        if (request.getAdvisorId() != null) {
            advisor = userRepository.findById(request.getAdvisorId()).orElse(null);
        }

        AcademicSection sec = AcademicSection.builder()
                .code(code)
                .sectionName(secName)
                .semester(sem)
                .academicYear(request.getAcademicYear() != null && !request.getAcademicYear().trim().isEmpty() ? request.getAcademicYear().trim() : "2025-26")
                .department(dept)
                .advisor(advisor)
                .roomNumber(request.getRoomNumber() != null && !request.getRoomNumber().trim().isEmpty() ? request.getRoomNumber().trim() : "Lecture Hall " + (100 + sem))
                .capacity(request.getCapacity() != null && request.getCapacity() > 0 ? request.getCapacity() : 60)
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        AcademicSection saved = academicSectionRepository.save(sec);
        return AppDTO.AcademicSectionResponse.from(saved, countEnrolledStudents(saved));
    }

    @Override
    @Transactional
    public AppDTO.AcademicSectionResponse updateSection(Long id, AppDTO.AcademicSectionRequest request) {
        AcademicSection sec = academicSectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic Section not found with ID: " + id));

        if (request.getSectionName() != null && !request.getSectionName().trim().isEmpty()) {
            sec.setSectionName(request.getSectionName().trim().toUpperCase());
        }
        if (request.getSemester() != null) {
            sec.setSemester(request.getSemester());
        }
        if (request.getAcademicYear() != null) {
            sec.setAcademicYear(request.getAcademicYear().trim());
        }
        if (request.getRoomNumber() != null) {
            sec.setRoomNumber(request.getRoomNumber().trim());
        }
        if (request.getCapacity() != null) {
            sec.setCapacity(request.getCapacity());
        }
        if (request.getStatus() != null) {
            sec.setStatus(request.getStatus());
        }
        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
            sec.setDepartment(dept);
        }
        if (request.getAdvisorId() != null) {
            User advisor = userRepository.findById(request.getAdvisorId()).orElse(null);
            sec.setAdvisor(advisor);
        }

        AcademicSection updated = academicSectionRepository.save(sec);
        return AppDTO.AcademicSectionResponse.from(updated, countEnrolledStudents(updated));
    }

    @Override
    @Transactional
    public void deleteSection(Long id) {
        AcademicSection sec = academicSectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic Section not found with ID: " + id));
        academicSectionRepository.delete(sec);
    }

    private void seedDefaultSections() {
        log.info("Seeding default University Academic Sections...");
        List<Department> departments = departmentRepository.findAll();
        List<User> facultyList = userRepository.findByRole(User.Role.FACULTY);

        if (departments.isEmpty()) {
            return;
        }

        List<AcademicSection> seedList = new ArrayList<>();
        int advisorIdx = 0;

        for (Department dept : departments) {
            String deptCode = dept.getCode() != null ? dept.getCode().toUpperCase() : "SEC";
            // Create Section A and Section B for Semesters 1 through 8
            for (int sem = 1; sem <= 8; sem++) {
                String[] secNames = {"A", "B"};
                for (String secName : secNames) {
                    String code = deptCode + "-" + sem + secName;
                    User advisor = !facultyList.isEmpty() ? facultyList.get(advisorIdx % facultyList.size()) : null;
                    advisorIdx++;

                    String room = deptCode.contains("CS") || deptCode.contains("AI")
                            ? "Newton Block Room " + (300 + sem * 10 + (secName.equals("A") ? 1 : 2))
                            : "Aryabhata Hall " + (200 + sem * 10 + (secName.equals("A") ? 1 : 2));

                    AcademicSection section = AcademicSection.builder()
                            .code(code)
                            .sectionName(secName)
                            .semester(sem)
                            .academicYear("2025-26")
                            .department(dept)
                            .advisor(advisor)
                            .roomNumber(room)
                            .capacity(60)
                            .status("ACTIVE")
                            .build();

                    seedList.add(section);
                }
            }
        }

        academicSectionRepository.saveAll(seedList);
        log.info("Successfully seeded {} University Academic Sections across {} departments.", seedList.size(), departments.size());
    }
}
