package com.legalease.caseservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cases")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    private String title;

    private String description;

    private String category;

    @Enumerated(EnumType.STRING)
    private CaseStatus status;

    private UUID policeOfficerId;

    private UUID investigatorId;

    private LocalDateTime createdAt;
}
