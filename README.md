# 🗳️ SystemVotting (Real-Time Voting System)

## 📌 Overview
SystemVotting is a full-stack, real-time polling and voting application designed to provide users with an interactive and seamless experience. Built with a robust **Spring Boot** backend and a modern **React (TypeScript)** frontend, the system leverages **WebSockets** for real-time dashboard updates, ensuring that vote counts, comments, and poll activities are instantly reflected across all connected clients.

## 🚀 Key Features
- **Real-Time Updates:** Live reflections of vote counts, poll creations, and deletions using WebSockets (STOMP). Real-time comments engagement.
- **Secure Authentication:** JWT-based authentication along with Google OAuth2 integration for easy onboarding.
- **RESTful API & Documentation:** Well-structured and documented APIs using Swagger/OpenAPI standard.
- **Data Caching & Performance:** Integrated Redis to optimize backend performance, request caching, and system scalability.
- **Email Notifications:** Automated mailing services powered by SendGrid to notify users on important engagements.
- **Interactive UI/UX:** Highly responsive data-driven design utilizing Tailwind CSS, detailed charts with Recharts, and engaging user animations (Canvas Confetti).
- **Containerization:** Fully Dockerized ecosystem (Frontend, Backend, and MySQL) for effortless local development and production deployment.

## 🛠️ Technology Stack

### **Frontend**
- **Framework:** React 19 (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **State & Routing:** React Router v7
- **WebSockets:** `@stomp/stompjs` for real-time channels
- **Data Visualization:** Recharts
- **Icons & UI Extras:** Lucide React, Canvas Confetti

### **Backend**
- **Framework:** Spring Boot 3.4.0 (Java 21)
- **Database:** MySQL 8.0 & Spring Data JPA
- **Caching:** Redis (Spring Data Redis)
- **Security:** Spring Security, JJWT (JSON Web Tokens), Google API Client
- **Mapping & Utilities:** MapStruct, Lombok
- **External Services:** SendGrid (Email Service)
- **API Documentation:** Springdoc OpenAPI (Swagger)

### **Infrastructure & DevOps**
- **Containerization:** Docker & Docker Compose
- **Web Server:** Nginx (Serving built frontend inside Docker)

## 📂 Project Structure
```text
SystemVotting/
├── backend/            # Spring Boot application (REST APIs, Security, WebSocket configuration)
├── frontend/           # React + Vite application (UI, State management, STOMP client)
└── docker-compose.yml  # Container orchestration for seamless full-stack execution
```

## ⚙️ Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose installed OR
- **Node.js** (for local frontend development) & **Java 21 + Maven** (for local backend development)

### Running with Docker (Recommended)
1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd SystemVotting
   ```
2. Create environment variables `.env` file for your confidential credentials (refer to `docker-compose.yml` for required keys like `DB_PASSWORD`, `JWT_SECRET_KEY`, `GOOGLE_CLIENT_ID`, `MAIL_PASSWORD`, etc.).
3. Start the entire application using Docker Compose:
   ```bash
   docker-compose up --build -d
   ```
4. Access the application:
   - **Frontend App:** `http://localhost:5173`
   - **Backend API:** `http://localhost:8080`
   - **Swagger UI API Docs:** `http://localhost:8080/swagger-ui/index.html`

## 🌟 Why this project stands out?
- **Full-stack Expertise:** Demonstrates comprehensive end-to-end development skills from designing relational databases to building highly responsive modern UIs.
- **Real-Time Problem Solving:** Showcases the ability to handle concurrent connections, synchronize state across clients using WebSockets, and broadcast messages reliably.
- **Modern Tech Ecosystem:** Utilizes the latest stable versions of industry-standard tech including Java 21, Spring Boot 3.4, React 19, Redis, Docker, and OAuth2.
- **Clean Architecture & Best Practices:** Adheres to DTO mappings with MapStruct, robust security configuration, dependency injection, and scalable containerized deployments.

---
*Developed by a Passionate Full-Stack Engineer*
