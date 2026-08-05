package com.legalease.caseservice.service;

import com.legalease.caseservice.dto.AssignInvestigatorDto;
import com.legalease.caseservice.dto.CaseDto;
import com.legalease.caseservice.dto.CreateCaseDto;
import com.legalease.caseservice.dto.UpdateCaseStatusDto;

import java.util.List;
import java.util.UUID;

public interface CaseService {
    CaseDto createCase(CreateCaseDto createCaseDto, UUID policeOfficerId);
    CaseDto assignInvestigator(UUID caseId, AssignInvestigatorDto assignInvestigatorDto);
    CaseDto updateCaseStatus(UUID caseId, UpdateCaseStatusDto updateCaseStatusDto);
    CaseDto getCaseById(UUID caseId);
    List<CaseDto> getAllCases();
    List<CaseDto> getCasesByOfficer(UUID policeOfficerId);
    List<CaseDto> getCasesByInvestigator(UUID investigatorId);
}
