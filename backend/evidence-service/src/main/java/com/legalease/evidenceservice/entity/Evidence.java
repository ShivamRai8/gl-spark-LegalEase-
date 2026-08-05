package com.legalease.evidenceservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "evidence")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Evidence {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    private UUID caseId;

    private String fileType;

    private String fileUrl;

    @Enumerated(EnumType.STRING)
    private VerificationStatus verificationStatus;

    private String remarks;

    private UUID uploaderId;

    private LocalDateTime uploadedAt;
}
