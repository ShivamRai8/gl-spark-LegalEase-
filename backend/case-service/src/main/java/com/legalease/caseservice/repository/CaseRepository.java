package com.legalease.caseservice.repository;

import com.legalease.caseservice.entity.Case;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CaseRepository extends JpaRepository<Case, UUID> {
    List<Case> findByPoliceOfficerId(UUID policeOfficerId);
    List<Case> findByInvestigatorId(UUID investigatorId);
}
