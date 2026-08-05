package com.legalease.auditservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditDto {
    private UUID id;
    private String serviceName;
    private String eventType;
    private String eventDetails;
    private LocalDateTime timestamp;
}
