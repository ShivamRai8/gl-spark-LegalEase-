package com.legalease.caseservice.controller;

import com.legalease.caseservice.dto.AssignInvestigatorDto;
import com.legalease.caseservice.dto.CaseDto;
import com.legalease.caseservice.dto.CreateCaseDto;
import com.legalease.caseservice.dto.UpdateCaseStatusDto;
import com.legalease.caseservice.service.CaseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cases")
public class CaseController {

    private final CaseService caseService;

    public CaseController(CaseService caseService) {
        this.caseService = caseService;
    }

    @GetMapping
    public ResponseEntity<List<CaseDto>> getAllCases(@RequestParam(value = "officerId", required = false) UUID officerId,
                                                     @RequestParam(value = "investigatorId", required = false) UUID investigatorId) {
        if (officerId != null) {
            return ResponseEntity.ok(caseService.getCasesByOfficer(officerId));
        }
        if (investigatorId != null) {
            return ResponseEntity.ok(caseService.getCasesByInvestigator(investigatorId));
        }
        return ResponseEntity.ok(caseService.getAllCases());
    }

    @PostMapping
    public ResponseEntity<CaseDto> createCase(@RequestBody CreateCaseDto createCaseDto, @RequestHeader("X-User-Id") UUID policeOfficerId) {
        return new ResponseEntity<>(caseService.createCase(createCaseDto, policeOfficerId), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<CaseDto> assignInvestigator(@PathVariable("id") UUID caseId, @RequestBody AssignInvestigatorDto assignInvestigatorDto) {
        return ResponseEntity.ok(caseService.assignInvestigator(caseId, assignInvestigatorDto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CaseDto> updateCaseStatus(@PathVariable("id") UUID caseId, @RequestBody UpdateCaseStatusDto updateCaseStatusDto) {
        return ResponseEntity.ok(caseService.updateCaseStatus(caseId, updateCaseStatusDto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CaseDto> getCaseById(@PathVariable("id") UUID caseId) {
        return ResponseEntity.ok(caseService.getCaseById(caseId));
    }
}
