package com.legalease.auditservice.controller;

import com.legalease.auditservice.dto.AuditDto;
import com.legalease.auditservice.entity.AuditLog;
import com.legalease.auditservice.repository.AuditLogRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/audit")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    public AuditController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public ResponseEntity<List<AuditDto>> getAllAuditLogs() {
        List<AuditDto> logs = auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp")).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/case/{caseId}")
    public ResponseEntity<List<AuditDto>> getAuditLogsForCase(@PathVariable("caseId") UUID caseId) {
        String caseIdText = caseId.toString();
        List<AuditDto> logs = auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp")).stream()
                .filter(log -> log.getEventDetails() != null && log.getEventDetails().contains(caseIdText))
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(logs);
    }

    private AuditDto toDto(AuditLog log) {
        return new AuditDto(log.getId(), log.getServiceName(), log.getEventType(), log.getEventDetails(), log.getTimestamp());
    }
}
