package com.sms.repository;

import com.sms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByStudentId(String studentId);
    Optional<User> findByRollNumber(String rollNumber);
    Optional<User> findByFacultyId(String facultyId);

    boolean existsByEmail(String email);
    boolean existsByStudentId(String studentId);
    boolean existsByRollNumber(String rollNumber);
    boolean existsByFacultyId(String facultyId);

    List<User> findByRole(User.Role role);

    @Query("SELECT u FROM User u WHERE u.role = 'STUDENT' AND u.branch = :branch")
    List<User> findStudentsByBranch(@Param("branch") String branch);

    @Query("SELECT u FROM User u WHERE u.role = 'STUDENT' AND (:department IS NULL OR u.department = :department) AND (:semester IS NULL OR u.semester = :semester)")
    List<User> findStudentsByFilter(@Param("department") String department, @Param("semester") Integer semester);

    @Query("SELECT u FROM User u WHERE u.email = :identifier OR u.rollNumber = :identifier OR u.studentId = :identifier OR u.facultyId = :identifier")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);
}
