package com.legalease.auditservice.listener;

import com.legalease.auditservice.service.AuditService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class AuditListener {

    private final AuditService auditService;

    public AuditListener(AuditService auditService) {
        this.auditService = auditService;
    }

    @KafkaListener(topics = "CASE_CREATED", groupId = "audit-group")
    public void listenCaseCreated(String message) {
        auditService.logEvent("case-service", "CASE_CREATED", message);
    }

    @KafkaListener(topics = "CASE_ASSIGNED", groupId = "audit-group")
    public void listenCaseAssigned(String message) {
        auditService.logEvent("case-service", "CASE_ASSIGNED", message);
    }

    @KafkaListener(topics = "EVIDENCE_UPLOADED", groupId = "audit-group")
    public void listenEvidenceUploaded(String message) {
        auditService.logEvent("evidence-service", "EVIDENCE_UPLOADED", message);
    }

    @KafkaListener(topics = "EVIDENCE_VERIFIED", groupId = "audit-group")
    public void listenEvidenceVerified(String message) {
        auditService.logEvent("evidence-service", "EVIDENCE_VERIFIED", message);
    }

    @KafkaListener(topics = "CASE_STATUS_UPDATED", groupId = "audit-group")
    public void listenCaseStatusUpdated(String message) {
        auditService.logEvent("case-service", "CASE_STATUS_UPDATED", message);
    }

    @KafkaListener(topics = "EVIDENCE_VIEWED", groupId = "audit-group")
    public void listenEvidenceViewed(String message) {
        auditService.logEvent("evidence-service", "EVIDENCE_VIEWED", message);
    }
}
