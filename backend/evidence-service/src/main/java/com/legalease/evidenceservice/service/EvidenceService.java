package com.legalease.evidenceservice.service;

import com.legalease.evidenceservice.dto.EvidenceDto;
import com.legalease.evidenceservice.dto.VerifyEvidenceDto;
import com.legalease.evidenceservice.entity.Evidence;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface EvidenceService {
    EvidenceDto uploadEvidence(UUID caseId, MultipartFile file, UUID uploaderId);
    EvidenceDto verifyEvidence(UUID evidenceId, VerifyEvidenceDto verifyEvidenceDto);
    List<EvidenceDto> getEvidenceForCase(UUID caseId);
    Evidence getEvidenceForDownload(UUID evidenceId, UUID viewerId);
}
