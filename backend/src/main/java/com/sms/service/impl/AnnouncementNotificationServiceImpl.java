package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.Announcement;
import com.sms.entity.Notification;
import com.sms.entity.User;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.AnnouncementRepository;
import com.sms.repository.NotificationRepository;
import com.sms.repository.UserRepository;
import com.sms.service.AnnouncementNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementNotificationServiceImpl implements AnnouncementNotificationService {

    private final AnnouncementRepository announcementRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private AppDTO.AnnouncementDTO toDTO(Announcement a) {
        return AppDTO.AnnouncementDTO.builder()
                .id(a.getId())
                .title(a.getTitle())
                .content(a.getContent())
                .category(a.getCategory())
                .priority(a.getPriority())
                .targetRole(a.getTargetRole())
                .targetDepartment(a.getTargetDepartment())
                .startDate(a.getStartDate())
                .endDate(a.getEndDate())
                .active(a.getActive())
                .createdByName(a.getCreatedBy() != null ? a.getCreatedBy().getName() : "Administration")
                .createdAt(a.getCreatedAt())
                .build();
    }

    private AppDTO.NotificationDTO toDTO(Notification n) {
        return AppDTO.NotificationDTO.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .link(n.getLink())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    @Override
    public List<AppDTO.AnnouncementDTO> getAllAnnouncements() {
        return announcementRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<AppDTO.AnnouncementDTO> getActiveAnnouncements(String role) {
        LocalDate today = LocalDate.now();
        String targetRole = (role != null) ? role.toUpperCase() : "STUDENT";
        return announcementRepository.findActiveForRole(targetRole, today).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppDTO.AnnouncementDTO createAnnouncement(AppDTO.AnnouncementDTO req, Long adminId) {
        User admin = adminId != null ? userRepository.findById(adminId).orElse(null) : null;

        Announcement a = Announcement.builder()
                .title(req.getTitle())
                .content(req.getContent())
                .category(req.getCategory() != null ? req.getCategory() : "GENERAL")
                .priority(req.getPriority() != null ? req.getPriority() : "NORMAL")
                .targetRole(req.getTargetRole() != null ? req.getTargetRole() : "ALL")
                .targetDepartment(req.getTargetDepartment())
                .startDate(req.getStartDate() != null ? req.getStartDate() : LocalDate.now())
                .endDate(req.getEndDate())
                .active(true)
                .createdBy(admin)
                .build();

        return toDTO(announcementRepository.save(a));
    }

    @Override
    @Transactional
    public void deleteAnnouncement(Long id) {
        announcementRepository.deleteById(id);
    }

    @Override
    public List<AppDTO.NotificationDTO> getUserNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markNotificationAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    @Override
    @Transactional
    public void markAllNotificationsAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }

    @Override
    @Transactional
    public void sendNotification(Long recipientId, String title, String message, String type, String link) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Notification n = Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .type(type != null ? type : "GENERAL")
                .link(link)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        notificationRepository.save(n);
    }
}
