package com.legalease.evidenceservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient("case-service")
public interface CaseClient {

    @GetMapping("/api/v1/cases/{id}")
    CaseStatusResponse getCaseById(@PathVariable("id") UUID caseId);
}
