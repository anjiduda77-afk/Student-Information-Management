package com.sms.repository;

import com.sms.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findTop50ByOrderByTimestampDesc();
    List<ActivityLog> findByModuleOrderByTimestampDesc(String module);
}
