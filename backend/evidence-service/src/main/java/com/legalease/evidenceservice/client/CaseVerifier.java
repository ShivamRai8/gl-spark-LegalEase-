package com.legalease.evidenceservice.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Thin wrapper around {@link CaseClient} so the circuit breaker is applied
 * to a proxied public method (a private method or self-invocation would
 * bypass the Spring AOP proxy and silently disable the breaker).
 */
@Component
public class CaseVerifier {

    private final CaseClient caseClient;

    public CaseVerifier(CaseClient caseClient) {
        this.caseClient = caseClient;
    }

    @CircuitBreaker(name = "caseService", fallbackMethod = "verifyCaseActiveFallback")
    public CaseStatusResponse verifyCaseActive(UUID caseId) {
        return caseClient.getCaseById(caseId);
    }

    public CaseStatusResponse verifyCaseActiveFallback(UUID caseId, Throwable t) {
        throw new RuntimeException("Case service is temporarily unavailable. Please try again later.");
    }
}
