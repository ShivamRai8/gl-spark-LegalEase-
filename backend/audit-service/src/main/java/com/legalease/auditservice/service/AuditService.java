package com.legalease.auditservice.service;

import com.legalease.auditservice.entity.AuditLog;
import com.legalease.auditservice.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void logEvent(String serviceName, String eventType, String eventDetails) {
        AuditLog auditLog = new AuditLog();
        auditLog.setServiceName(serviceName);
        auditLog.setEventType(eventType);
        auditLog.setEventDetails(eventDetails);
        auditLog.setTimestamp(LocalDateTime.now());
        auditLogRepository.save(auditLog);
    }
}
