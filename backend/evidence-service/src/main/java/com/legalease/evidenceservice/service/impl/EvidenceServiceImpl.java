package com.legalease.evidenceservice.service.impl;

import com.legalease.evidenceservice.client.CaseStatusResponse;
import com.legalease.evidenceservice.client.CaseVerifier;
import com.legalease.evidenceservice.dto.EvidenceDto;
import com.legalease.evidenceservice.dto.VerifyEvidenceDto;
import com.legalease.evidenceservice.entity.Evidence;
import com.legalease.evidenceservice.entity.VerificationStatus;
import com.legalease.evidenceservice.exception.CaseClosedException;
import com.legalease.evidenceservice.repository.EvidenceRepository;
import com.legalease.evidenceservice.service.EvidenceService;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EvidenceServiceImpl implements EvidenceService {

    private final EvidenceRepository evidenceRepository;
    private final CaseVerifier caseVerifier;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final Path root;

    public EvidenceServiceImpl(EvidenceRepository evidenceRepository, CaseVerifier caseVerifier,
                               KafkaTemplate<String, String> kafkaTemplate) {
        this.evidenceRepository = evidenceRepository;
        this.caseVerifier = caseVerifier;
        this.kafkaTemplate = kafkaTemplate;
        this.root = Paths.get("uploads").toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize folder for upload!");
        }
    }

    @Override
    public EvidenceDto uploadEvidence(UUID caseId, MultipartFile file, UUID uploaderId) {
        CaseStatusResponse caseStatus = caseVerifier.verifyCaseActive(caseId);

        if ("CLOSED".equalsIgnoreCase(caseStatus.getStatus())) {
            throw new CaseClosedException("Case is closed. Evidence can no longer be uploaded.");
        }

        String storedName = storeFile(file);
        Evidence evidence = new Evidence();
        evidence.setCaseId(caseId);
        evidence.setFileType(file.getContentType());
        evidence.setFileUrl(storedName);
        evidence.setVerificationStatus(VerificationStatus.PENDING);
        evidence.setUploaderId(uploaderId);
        evidence.setUploadedAt(LocalDateTime.now());

        Evidence savedEvidence = evidenceRepository.save(evidence);

        kafkaTemplate.send("EVIDENCE_UPLOADED", "Evidence uploaded for case: " + caseId + " by user: " + uploaderId);

        return toDto(savedEvidence);
    }

    private String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Uploaded file is empty");
        }
        String original = file.getOriginalFilename();
        String extension = "";
        if (original != null) {
            int dot = original.lastIndexOf('.');
            if (dot >= 0 && dot < original.length() - 1) {
                extension = original.substring(dot).replaceAll("[^a-zA-Z0-9.]", "");
            }
        }
        String storedName = UUID.randomUUID() + extension;
        Path target = root.resolve(storedName).normalize();
        if (!target.startsWith(root)) {
            throw new RuntimeException("Invalid file name");
        }
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target);
        } catch (IOException e) {
            throw new RuntimeException("Could not store the file. Error: " + e.getMessage());
        }
        return storedName;
    }

    @Override
    public Evidence getEvidenceForDownload(UUID evidenceId, UUID viewerId) {
        Evidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new RuntimeException("Evidence not found"));

        kafkaTemplate.send("EVIDENCE_VIEWED",
                "Evidence " + evidenceId + " of case " + evidence.getCaseId() + " was accessed by user " + viewerId);

        return evidence;
    }

    @Override
    public EvidenceDto verifyEvidence(UUID evidenceId, VerifyEvidenceDto verifyEvidenceDto) {
        Evidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new RuntimeException("Evidence not found"));

        if (verifyEvidenceDto.getStatus() == VerificationStatus.REJECTED
                && (verifyEvidenceDto.getRemarks() == null || verifyEvidenceDto.getRemarks().isBlank())) {
            throw new RuntimeException("Remarks are required when rejecting evidence");
        }

        evidence.setVerificationStatus(verifyEvidenceDto.getStatus());
        evidence.setRemarks(verifyEvidenceDto.getRemarks());

        Evidence updatedEvidence = evidenceRepository.save(evidence);

        kafkaTemplate.send("EVIDENCE_VERIFIED", "Evidence verified for case: " + updatedEvidence.getCaseId());

        return toDto(updatedEvidence);
    }

    @Override
    public List<EvidenceDto> getEvidenceForCase(UUID caseId) {
        return evidenceRepository.findByCaseId(caseId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private EvidenceDto toDto(Evidence e) {
        return new EvidenceDto(e.getId(), e.getCaseId(), e.getFileType(), e.getFileUrl(), e.getVerificationStatus(), e.getRemarks(), e.getUploaderId(), e.getUploadedAt());
    }
}
