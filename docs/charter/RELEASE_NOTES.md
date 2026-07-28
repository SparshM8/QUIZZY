# Release Notes

## v0.2.0 — Assignments and Coding Platform (July 28, 2026)

The second platform release closes out the coding evaluation and assignment workflows. Students can now submit code against coding questions and file-based assignments, and teachers can review submissions against rubrics.

**New features**

- Coding question type with per-test-case limits (time and memory)
- Judge queue powered by BullMQ and Redis, with a local fallback judge for development
- Verdict computation (accepted, wrong answer, compile error) with partial scoring on the test-case level
- Monaco-based code editor with per-language scaffolding
- Assignment model with due dates, attachments, and file submissions via multipart upload
- Rubric-based grading with weighted criteria and teacher feedback
- In-app notifications for new assignments, grades, and test results

**Infrastructure**

- Redis added to the Docker Compose stack for the judge queue
- Multer integrated for file uploads with size limits and MIME validation

## v0.1.0 — MVP: Question Bank and Test Delivery (May 15, 2026)

The first platform release delivers the core assessment loop: teachers build question banks and quizzes, students take timed tests, and results are scored automatically.

**New features**

- Authentication with JWT access and refresh tokens, plus role-based access control (admin, teacher, student)
- Question bank supporting seven question types: MCQ, multi-select, true/false, fill-in-the-blank, numerical, subjective, and coding
- Moderation workflow for questions (draft → pending → approved/rejected)
- Test creation with sections, instructions, duration, scheduling, and invite links
- Delivery session with heartbeat, answer autosave, and navigation rules
- Automatic objective scoring with teacher review for subjective answers
- Results page with per-question breakdown and teacher analytics dashboard
- In-app notifications for test invites and results

**Infrastructure**

- Express + TypeScript backend with centralized error handling and audit logging
- React 18 + Vite + Tailwind CSS frontend
- MongoDB with Mongoose, Docker Compose for local development
- Jest test suites covering auth, questions, and test delivery with coverage thresholds
