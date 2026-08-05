# LegalEase - Enterprise Legal Case & Evidence Management Platform

This project is a distributed microservices application for managing legal cases and evidence.

## Modules

*   **service-registry**: Eureka server for service discovery.
*   **config-server**: Spring Cloud Config server for centralized configuration.
*   **api-gateway**: Spring Cloud Gateway for routing and security.
*   **user-service**: Manages users, roles, and authentication.
*   **case-service**: Manages legal cases.
*   **evidence-service**: Manages evidence related to cases.
*   **notification-service**: Sends notifications (e.g., email).
*   **audit-service**: Logs all important events.
*   **frontend**: React-based user interface.

## How to Run

### Prerequisites

*   Java 17
*   Maven
*   Node.js & npm
*   PostgreSQL
*   Apache Kafka

### Backend

1.  **Start Kafka and Zookeeper.**
2.  **Create PostgreSQL databases**: `user_db`, `case_db`, `evidence_db`, `audit_db`.
3.  **Start the services in the following order**:
    1.  `service-registry`
    2.  `config-server`
    3.  `api-gateway`
    4.  `user-service`
    5.  `case-service`
    6.  `evidence-service`
    7.  `notification-service`
    8.  `audit-service`

You can run each service by navigating to its directory and running:

```bash
mvn spring-boot:run
```

### Frontend

1.  Navigate to the `frontend` directory.
2.  Run `npm install` to install dependencies.
3.  Run `npm start` to start the development server.

The application will be available at `http://localhost:3000`.

