package com.legalease.caseservice.dto;

import com.legalease.caseservice.entity.CaseStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCaseStatusDto {
    private CaseStatus status;
}
