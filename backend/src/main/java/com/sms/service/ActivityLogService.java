package com.sms.service;

import com.sms.dto.AppDTO;
import java.util.List;

public interface ActivityLogService {
    void log(String userEmail, String userName, String userRole, String action, String module, String description);
    List<AppDTO.ActivityLogDTO> getRecentLogs();
}
