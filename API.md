# Quizzy Placement Pro: API Documentation

This document outlines the core API endpoints for **Quizzy Placement Pro**. All requests require a JSON body (where applicable) and return JSON responses.

## 🔐 Authentication
Most endpoints require a Bearer Token in the `Authorization` header.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/login` | Authenticate user and receive tokens | No |
| POST | `/api/auth/register` | Create a new student or faculty account | No |
| GET | `/api/auth/me` | Get current user profile | Yes |

## 📝 Assessments (Tests)
Manage and participate in placement tests.

| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| GET | `/api/tests` | List all available tests | Student/Faculty |
| POST | `/api/tests` | Create a new assessment | Faculty |
| GET | `/api/tests/:id` | Get detailed test configuration | Student/Faculty |
| POST | `/api/tests/:id/enroll` | Enroll a student in a test | Faculty |

## 🛡️ Proctoring & Integrity
Real-time monitoring and violation logging.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/api/tests/attempts/:id/violations` | Log a proctoring violation (tab-switch, AI detection, etc.) | Yes |
| GET | `/api/analytics/live` | Real-time monitoring feed for active attempts | Faculty |

## 💻 Coding Judge
Execute and grade technical challenges.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/api/coding/submit` | Submit code for automated grading | Yes |
| GET | `/api/coding/submissions/:id` | Get status and result of a coding submission | Yes |

## 📊 Analytics
Performance and readiness insights.

| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| GET | `/api/analytics/skills` | Get student skill-gap and readiness report | Student |
| GET | `/api/analytics/cohorts` | Get departmental and year-wise trends | Faculty |
| GET | `/api/analytics/tests/:id/export` | Export assessment results as CSV | Faculty |

## 🤖 AI Features
AI-driven interview and feedback modules.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/api/ai/interview` | Send/Receive messages for AI Mock Interview | Yes |

---
For detailed request/response schemas, refer to the `backend/src/controllers` directory.
