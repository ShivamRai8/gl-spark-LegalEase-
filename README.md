# gl-spark-LegalEase-

# ⚖️ LegalEase – Enterprise Legal Case & Evidence Management Platform

LegalEase is a full-stack enterprise-grade Legal Case and Digital Evidence Management Platform developed as a capstone project using a microservices architecture. The platform is designed to digitize and streamline the complete lifecycle of legal investigations by providing a secure, scalable, and role-based environment for managing cases, digital evidence, notifications, and audit logs.

The system replaces traditional paper-based workflows with a centralized platform where Police Officers, Investigators, Lawyers, Judges, Forensic Experts, and Administrators can collaborate efficiently while maintaining strict security, transparency, and accountability.

## 🚀 Key Features

* JWT-based Authentication and Role-Based Access Control (RBAC)
* Enterprise Microservices Architecture using Spring Boot
* API Gateway for centralized routing and security
* Eureka Service Discovery and Config Server
* Legal Case Management with complete case lifecycle tracking
* Digital Evidence Upload and Management
* Evidence Verification by Forensic Experts
* Immutable Audit Logging for every critical action
* Kafka-based Event-Driven Communication
* Email Notifications for important system events
* PostgreSQL Database for persistent storage
* React + TypeScript frontend with responsive dashboards
* RESTful APIs with validation and centralized exception handling

## 👥 Supported User Roles

* Administrator
* Police Officer
* Investigator
* Lawyer
* Judge
* Forensic Expert

Each role has predefined permissions to ensure secure access to system resources through Role-Based Access Control.

## 🏗️ System Architecture

The application follows a distributed microservices architecture consisting of:

* Service Registry (Eureka Server)
* Config Server
* API Gateway
* User Service
* Case Service
* Evidence Service
* Notification Service
* Audit Service
* Apache Kafka
* PostgreSQL Databases
* React Frontend

The services communicate synchronously using OpenFeign and asynchronously through Apache Kafka to provide a scalable, loosely coupled, and fault-tolerant system.

## 🔄 Workflow

1. Administrator registers users and assigns roles.
2. Police Officer creates a legal case.
3. Investigator is assigned to the case.
4. Investigator uploads digital evidence.
5. Forensic Expert verifies or rejects evidence.
6. Lawyer reviews assigned cases and evidence.
7. Judge reviews the complete audit trail and closes or reopens cases.
8. Audit and Notification services automatically process Kafka events for every important action.

## 🛠️ Technology Stack

### Backend

* Java 17
* Spring Boot
* Spring Security
* Spring Cloud Gateway
* Spring Cloud Eureka
* Spring Cloud Config
* Spring Data JPA
* PostgreSQL
* Apache Kafka
* OpenFeign
* Resilience4J
* Maven

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Axios
* React Router

### Tools

* IntelliJ IDEA
* Visual Studio Code
* Postman
* pgAdmin
* Git & GitHub

## 🎯 Project Objectives

* Digitize legal case management.
* Maintain secure chain of custody for digital evidence.
* Provide immutable audit trails.
* Implement secure role-based access.
* Demonstrate enterprise microservices architecture.
* Enable scalable event-driven communication using Kafka.

This project demonstrates the implementation of modern enterprise software engineering concepts including microservices, distributed systems, event-driven architecture, secure authentication, REST APIs, asynchronous messaging, and full-stack application development.
