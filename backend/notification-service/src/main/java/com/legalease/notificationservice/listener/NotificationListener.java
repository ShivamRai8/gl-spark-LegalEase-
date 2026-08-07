package com.legalease.notificationservice.listener;

import com.legalease.notificationservice.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationListener {

    private static final Logger logger = LoggerFactory.getLogger(NotificationListener.class);

    private final EmailService emailService;

    @Value("${notification.default-recipient:rai91844@gmail.com}")
    private String defaultRecipient;

    public NotificationListener(EmailService emailService) {
        this.emailService = emailService;
    }

    @KafkaListener(topics = "CASE_ASSIGNED", groupId = "notification-group")
    public void listenCaseAssigned(String message) {
        // In a real application, you would parse the message to get user details
        sendSafely(defaultRecipient, "Case Assigned", message);
    }

    @KafkaListener(topics = "EVIDENCE_VERIFIED", groupId = "notification-group")
    public void listenEvidenceVerified(String message) {
        // In a real application, you would parse the message to get user details
        sendSafely(defaultRecipient, "Evidence Verified", message);
    }


    @KafkaListener(topics = "CASE_CREATED", groupId = "notification-group")
    public void listenCaseCreated(String message) {
        sendSafely(defaultRecipient, "Case Created", message);
    }

    @KafkaListener(topics = "CASE_STATUS_UPDATED", groupId = "notification-group")
    public void listenCaseStatusUpdated(String message) {
        sendSafely(defaultRecipient, "Case Status Updated", message);
    }

    private void sendSafely(String to, String subject, String body) {
        try {
            emailService.sendEmail(to, subject, body);
        } catch (Exception ex) {
            logger.warn("Failed to send email to {} for '{}': {}", to, subject, ex.getMessage());
        }
    }
}
