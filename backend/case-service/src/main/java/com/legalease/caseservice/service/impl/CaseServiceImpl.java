package com.legalease.caseservice.service.impl;

import com.legalease.caseservice.client.UserClient;
import com.legalease.caseservice.dto.AssignInvestigatorDto;
import com.legalease.caseservice.dto.CaseDto;
import com.legalease.caseservice.dto.CreateCaseDto;
import com.legalease.caseservice.dto.UpdateCaseStatusDto;
import com.legalease.caseservice.entity.Case;
import com.legalease.caseservice.entity.CaseStatus;
import com.legalease.caseservice.repository.CaseRepository;
import com.legalease.caseservice.service.CaseService;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CaseServiceImpl implements CaseService {

    private final CaseRepository caseRepository;
    private final UserClient userClient;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public CaseServiceImpl(CaseRepository caseRepository, UserClient userClient, KafkaTemplate<String, String> kafkaTemplate) {
        this.caseRepository = caseRepository;
        this.userClient = userClient;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Override
    public CaseDto createCase(CreateCaseDto createCaseDto, UUID policeOfficerId) {
        userClient.getUserById(policeOfficerId); // Verify user exists

        Case newCase = new Case();
        newCase.setTitle(createCaseDto.getTitle());
        newCase.setDescription(createCaseDto.getDescription());
        newCase.setCategory(createCaseDto.getCategory());
        newCase.setStatus(CaseStatus.OPEN);
        newCase.setPoliceOfficerId(policeOfficerId);
        newCase.setCreatedAt(LocalDateTime.now());

        Case savedCase = caseRepository.save(newCase);

        kafkaTemplate.send("CASE_CREATED", "Case created with id: " + savedCase.getId());

        return toDto(savedCase);
    }

    @Override
    public CaseDto assignInvestigator(UUID caseId, AssignInvestigatorDto assignInvestigatorDto) {
        userClient.getUserById(assignInvestigatorDto.getInvestigatorId()); // Verify user exists

        Case existingCase = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        existingCase.setInvestigatorId(assignInvestigatorDto.getInvestigatorId());
        Case updatedCase = caseRepository.save(existingCase);

        kafkaTemplate.send("CASE_ASSIGNED", "Investigator assigned to case: " + updatedCase.getId());

        return toDto(updatedCase);
    }

    @Override
    public CaseDto updateCaseStatus(UUID caseId, UpdateCaseStatusDto updateCaseStatusDto) {
        Case existingCase = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        existingCase.setStatus(updateCaseStatusDto.getStatus());
        Case updatedCase = caseRepository.save(existingCase);

        kafkaTemplate.send("CASE_STATUS_UPDATED",
                "Case status updated for case: " + updatedCase.getId() + " to " + updateCaseStatusDto.getStatus());

        return toDto(updatedCase);
    }

    @Override
    public CaseDto getCaseById(UUID caseId) {
        Case existingCase = caseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found"));
        return toDto(existingCase);
    }

    @Override
    public List<CaseDto> getAllCases() {
        return caseRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CaseDto> getCasesByOfficer(UUID policeOfficerId) {
        return caseRepository.findByPoliceOfficerId(policeOfficerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CaseDto> getCasesByInvestigator(UUID investigatorId) {
        return caseRepository.findByInvestigatorId(investigatorId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private CaseDto toDto(Case c) {
        return new CaseDto(c.getId(), c.getTitle(), c.getDescription(), c.getCategory(), c.getStatus(), c.getPoliceOfficerId(), c.getInvestigatorId(), c.getCreatedAt());
    }
}
