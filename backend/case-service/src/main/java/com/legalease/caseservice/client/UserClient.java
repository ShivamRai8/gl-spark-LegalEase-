package com.legalease.caseservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient("user-service")
public interface UserClient {

    @GetMapping("/api/v1/users/{id}")
    void getUserById(@PathVariable("id") UUID userId);
}
