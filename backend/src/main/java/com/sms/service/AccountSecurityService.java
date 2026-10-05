package com.sms.service;

import com.sms.entity.User;
import com.sms.exception.ConflictException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountSecurityService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogService activityLogService;

    // Password requirements pattern: >=8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    private static final Pattern PWD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+\\-={}\\[\\]|:;\"'<>,./]).{8,}$");

    public void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new ConflictException("Password must contain at least 8 characters.");
        }
        if (!Pattern.compile("[A-Z]").matcher(password).find()) {
            throw new ConflictException("Password must contain at least one uppercase letter.");
        }
        if (!Pattern.compile("[a-z]").matcher(password).find()) {
            throw new ConflictException("Password must contain at least one lowercase letter.");
        }
        if (!Pattern.compile("\\d").matcher(password).find()) {
            throw new ConflictException("Password must contain at least one number.");
        }
        if (!Pattern.compile("[@$!%*?&#^()_+\\-={}\\[\\]|:;\"'<>,./]").matcher(password).find()) {
            throw new ConflictException("Password must contain at least one special character.");
        }
    }

    @Transactional
    public void selfChangePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new ConflictException("Current password is incorrect.");
        }

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new ConflictException("New password must be different from your current password.");
        }

        validatePasswordStrength(newPassword);

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setForcePasswordChange(false);
        user.setLastPasswordChange(LocalDateTime.now());
        userRepository.save(user);

        // Security Audit Log (Never log passwords or hashes!)
        activityLogService.log(user.getEmail(), user.getName(), user.getRole().name(),
                "PASSWORD_CHANGE", "AUTH", "USER", String.valueOf(user.getId()),
                null, null, "User updated their account password successfully.");

        log.info("Password changed successfully for user ID: {}", userId);
    }

    @Transactional
    public void adminResetPassword(Long targetUserId, String newPassword, Boolean forceOnNextLogin, Long adminId) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Target user account not found"));
        User admin = adminId != null ? userRepository.findById(adminId).orElse(null) : null;

        validatePasswordStrength(newPassword);

        target.setPassword(passwordEncoder.encode(newPassword));
        target.setForcePasswordChange(forceOnNextLogin != null && forceOnNextLogin);
        target.setLastPasswordChange(LocalDateTime.now());
        userRepository.save(target);

        // Audit Log (Never log passwords or hashes!)
        if (admin != null) {
            activityLogService.log(admin.getEmail(), admin.getName(), admin.getRole().name(),
                    "PASSWORD_RESET", "AUTH", "USER", String.valueOf(target.getId()),
                    null, null, "ADMIN reset password for user: " + target.getName() + " (" + target.getEmail() + ") - Force change: " + target.getForcePasswordChange());
        }

        log.info("Admin reset password for user ID: {}", targetUserId);
    }

    @Transactional
    public void updateProfilePhoto(Long userId, String photoUrl, Long operatorId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User operator = operatorId != null ? userRepository.findById(operatorId).orElse(null) : null;

        String oldPhoto = user.getProfilePhoto();
        user.setProfilePhoto(photoUrl);
        userRepository.save(user);

        if (operator != null) {
            activityLogService.log(operator.getEmail(), operator.getName(), operator.getRole().name(),
                    "UPDATE_PHOTO", "PROFILE", "USER", String.valueOf(userId),
                    oldPhoto, photoUrl, operator.getName() + " updated profile photo for " + user.getName());
        }
    }

    @Transactional
    public void removeProfilePhoto(Long userId, Long operatorId) {
        updateProfilePhoto(userId, null, operatorId);
    }

    @Transactional
    public void updateAccountStatus(Long userId, String status, Long operatorId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User operator = operatorId != null ? userRepository.findById(operatorId).orElse(null) : null;

        String oldStatus = user.getStatus();
        user.setStatus(status.toUpperCase());
        userRepository.save(user);

        if (operator != null) {
            activityLogService.log(operator.getEmail(), operator.getName(), operator.getRole().name(),
                    "STATUS_CHANGE", "AUTH", "USER", String.valueOf(userId),
                    oldStatus, status.toUpperCase(), operator.getName() + " changed account status of " + user.getName() + " to " + status.toUpperCase());
        }
    }
}
