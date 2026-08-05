package com.legalease.evidenceservice.controller;

import com.legalease.evidenceservice.dto.EvidenceDto;
import com.legalease.evidenceservice.dto.VerifyEvidenceDto;
import com.legalease.evidenceservice.entity.Evidence;
import com.legalease.evidenceservice.service.EvidenceService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/evidence")
public class EvidenceController {

    private final EvidenceService evidenceService;
    private final Path uploadRoot;

    public EvidenceController(EvidenceService evidenceService) {
        this.evidenceService = evidenceService;
        this.uploadRoot = Paths.get("uploads").toAbsolutePath().normalize();
    }

    @PostMapping
    public ResponseEntity<EvidenceDto> uploadEvidence(@RequestParam("caseId") UUID caseId,
                                                      @RequestParam("file") MultipartFile file,
                                                      @RequestHeader("X-User-Id") UUID uploaderId) {
        return new ResponseEntity<>(evidenceService.uploadEvidence(caseId, file, uploaderId), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/verify")
    public ResponseEntity<EvidenceDto> verifyEvidence(@PathVariable("id") UUID evidenceId, @RequestBody VerifyEvidenceDto verifyEvidenceDto) {
        return ResponseEntity.ok(evidenceService.verifyEvidence(evidenceId, verifyEvidenceDto));
    }

    @GetMapping("/case/{id}")
    public ResponseEntity<List<EvidenceDto>> getEvidenceForCase(@PathVariable("id") UUID caseId) {
        return ResponseEntity.ok(evidenceService.getEvidenceForCase(caseId));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> downloadEvidence(@PathVariable("id") UUID evidenceId,
                                                               @RequestHeader(value = "X-User-Id", required = false) UUID viewerId) {
        Evidence evidence = evidenceService.getEvidenceForDownload(evidenceId, viewerId);

        Path path = resolveStoredFile(evidence.getFileUrl());
        if (!Files.exists(path) || !Files.isReadable(path)) {
            throw new RuntimeException("Evidence file is missing on the storage volume");
        }

        String fileName = path.getFileName().toString();
        String contentType = evidence.getFileType() != null && !evidence.getFileType().isBlank()
                ? evidence.getFileType()
                : "application/octet-stream";

        try {
            InputStreamResource resource = new InputStreamResource(new FileInputStream(path.toFile()));
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(path.toFile().length())
                    .body(resource);
        } catch (FileNotFoundException e) {
            throw new RuntimeException("Evidence file could not be read");
        }
    }

    private Path resolveStoredFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            throw new RuntimeException("Evidence has no file reference");
        }
        Path stored = Paths.get(fileUrl);
        Path resolved = stored.isAbsolute() ? stored.normalize() : uploadRoot.resolve(stored).normalize();
        if (!resolved.startsWith(uploadRoot)) {
            throw new RuntimeException("Evidence file path is outside the storage volume");
        }
        return resolved;
    }
}
