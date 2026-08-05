package com.legalease.caseservice.dto;

import com.legalease.caseservice.entity.CaseStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CaseDto {
    private UUID id;
    private String title;
    private String description;
    private String category;
    private CaseStatus status;
    private UUID policeOfficerId;
    private UUID investigatorId;
    private LocalDateTime createdAt;
}
