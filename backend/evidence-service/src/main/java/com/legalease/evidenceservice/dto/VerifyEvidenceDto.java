package com.legalease.evidenceservice.dto;

import com.legalease.evidenceservice.entity.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyEvidenceDto {
    private VerificationStatus status;
    private String remarks;
}
