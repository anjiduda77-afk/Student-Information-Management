package com.sms.service.impl;

import com.sms.dto.AppDTO;
import com.sms.entity.ActivityLog;
import com.sms.repository.ActivityLogRepository;
import com.sms.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityLogServiceImpl implements ActivityLogService {

    private final ActivityLogRepository logRepository;

    @Override
    @Transactional
    public void log(String userEmail, String userName, String userRole, String action, String module, String description) {
        ActivityLog entry = ActivityLog.builder()
                .userEmail(userEmail)
                .userName(userName)
                .userRole(userRole)
                .action(action)
                .module(module)
                .description(description)
                .timestamp(LocalDateTime.now())
                .build();
        logRepository.save(entry);
    }

    @Override
    @Transactional
    public void log(String userEmail, String userName, String userRole, String action, String module, String entityName, String entityId, String oldValue, String newValue, String description) {
        ActivityLog entry = ActivityLog.builder()
                .userEmail(userEmail)
                .userName(userName)
                .userRole(userRole)
                .action(action)
                .module(module)
                .entityName(entityName)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .description(description)
                .timestamp(LocalDateTime.now())
                .build();
        logRepository.save(entry);
    }

    @Override
    public List<AppDTO.ActivityLogDTO> getRecentLogs() {
        return logRepository.findTop50ByOrderByTimestampDesc().stream()
                .map(l -> AppDTO.ActivityLogDTO.builder()
                        .id(l.getId())
                        .userEmail(l.getUserEmail())
                        .userName(l.getUserName())
                        .userRole(l.getUserRole())
                        .action(l.getAction())
                        .module(l.getModule())
                        .entityName(l.getEntityName())
                        .entityId(l.getEntityId())
                        .oldValue(l.getOldValue())
                        .newValue(l.getNewValue())
                        .description(l.getDescription())
                        .timestamp(l.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }
}
