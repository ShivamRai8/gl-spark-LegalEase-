package com.legalease.evidenceservice.dto;

import com.legalease.evidenceservice.entity.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvidenceDto {
    private UUID id;
    private UUID caseId;
    private String fileType;
    private String fileUrl;
    private VerificationStatus verificationStatus;
    private String remarks;
    private UUID uploaderId;
    private LocalDateTime uploadedAt;
}
