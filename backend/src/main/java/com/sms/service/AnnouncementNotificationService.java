package com.sms.service;

import com.sms.dto.AppDTO;
import java.util.List;

public interface AnnouncementNotificationService {
    // Announcements
    List<AppDTO.AnnouncementDTO> getAllAnnouncements();
    List<AppDTO.AnnouncementDTO> getActiveAnnouncements(String role);
    AppDTO.AnnouncementDTO createAnnouncement(AppDTO.AnnouncementDTO request, Long adminId);
    void deleteAnnouncement(Long id);

    // Notifications
    List<AppDTO.NotificationDTO> getUserNotifications(Long userId);
    long getUnreadCount(Long userId);
    void markNotificationAsRead(Long notificationId);
    void markAllNotificationsAsRead(Long userId);
    void sendNotification(Long recipientId, String title, String message, String type, String link);
}
