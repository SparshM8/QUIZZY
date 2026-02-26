# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## Quizzy - Online Examination Platform

**Document Version:** 1.0  
**Last Updated:** February 25, 2026  
**Status:** In Development (50% Complete)  
**Project Lead:** Sparsh Mishra

---

## 1. EXECUTIVE SUMMARY

**Project Name:** Quizzy - Comprehensive Online Examination Platform

**Purpose:** Quizzy is a secure, scalable online examination platform designed for educational institutions and training centers. It provides real-time exam monitoring, automated e-certification, and advanced analytics with role-based access control for administrators and students.

**Target Users:**
- Educational Institutions (Schools, Colleges, Universities)
- Training Centers & Online Academies
- Corporate HR Departments
- Certification Bodies

**Key Objectives:**
1. Provide a secure examination environment with cheating detection
2. Automate certificate generation and distribution
3. Enable real-time performance analytics
4. Support large-scale concurrent exam sessions
5. Ensure data integrity and user authentication

---

## 2. PROJECT SCOPE

### 2.1 Included Features

#### 2.1.1 User Management & Authentication
- User registration and login (Students & Admins)
- Role-based access control (RBAC)
- Secure password hashing with bcryptjs
- JWT-based session management
- Profile management with avatar upload
- Login attempt tracking with account lockout

#### 2.1.2 Exam Management
- Create and manage examinations
- Add questions with multiple difficulty levels
- Set passing scores and duration limits
- Schedule exams with start/end times
- Manage exam status (Draft, Scheduled, Active, Completed)
- Student enrollment management
- Real-time exam monitoring

#### 2.1.3 Security & Monitoring
- Real-time tab switching detection
- Prevent common cheating shortcuts
- Continuous activity monitoring
- Security violation logging
- Answer submission tracking
- Exam lockdown mode (optional webcam required)

#### 2.1.4 E-Certification
- Automatic certificate generation upon passing
- PDF certificate download
- Certificate verification system
- QR code generation for certificates
- Certificate expiry management
- Certificate revocation capability
- Email distribution of certificates

#### 2.1.5 Analytics & Reporting
- Individual exam performance analysis
- Question-level statistics
- Exam pass/fail rates
- Average scores and time analytics
- Performance trends over time
- Student progress tracking
- Admin dashboard with real-time metrics

#### 2.1.6 Notifications System
- Real-time email notifications
- In-app notification center
- Exam reminders
- Results notification
- Certificate issuance alerts
- System announcements
- Scheduled notifications

### 2.2 Excluded Features (Out of Scope)

- Video monitoring/proctoring (can be added later)
- Mobile app (desktop responsive only)
- Payment/subscription management
- Two-factor authentication (basic JWT only)
- Advanced ML-based cheating detection
- Integration with third-party LMS systems

---

## 3. TECHNOLOGY STACK

### 3.1 Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 18.x |
| Styling | Tailwind CSS | 3.x |
| Icons | Lucide React | Latest |
| HTTP Client | Axios | 1.13.x |
| State Management | React Hooks | Built-in |
| Build Tool | Create React App | 5.x |

### 3.2 Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.18.x |
| Database | MySQL | 8.0 |
| ORM | Sequelize | 6.35.x |
| Authentication | JWT | jsonwebtoken 9.x |
| Password Hashing | bcryptjs | 2.4.x |
| Logging | Winston | 3.11.x |
| Validation | Joi + express-validator | Latest |
| Email | Nodemailer | 7.x |
| Rate Limiting | express-rate-limit | 6.10.x |
| Security | Helmet.js | 7.x |
| Compression | gzip | Built-in |

### 3.3 Infrastructure
| Component | Technology | Version |
|-----------|-----------|---------|
| Containerization | Docker | Latest |
| Orchestration | Docker Compose | 3.8 |
| Web Server | Nginx | 1.x (in frontend container) |
| SSL/TLS | Let's Encrypt | Auto-renew |
| Hosting | AWS/DigitalOcean/Heroku | Flexible |

---

## 4. FUNCTIONAL REQUIREMENTS

### 4.1 User Management Module

#### FR-1.1: User Registration
**Description:** New users can create accounts with email and password  
**Actors:** Unregistered users  
**Preconditions:** User has valid email, password meets security requirements  
**Steps:**
1. User navigates to registration page
2. Enters name, email, and password
3. System validates input (email format, password strength)
4. System checks for duplicate email
5. Password is hashed with bcryptjs
6. User record created in database
7. Confirmation email sent

**Postconditions:** User account created, user notified, can now login  
**Priority:** High  
**Status:** ⏳ Needs Route Implementation

#### FR-1.2: User Login
**Description:** Registered users can authenticate with email/password  
**Actors:** Registered users  
**Preconditions:** Valid email and password combination exists  
**Steps:**
1. User enters email and password
2. System validates credentials against database
3. If invalid, increment login attempts (max 5)
4. If locked (5+ attempts), account locked for 2 hours
5. If valid, generate JWT token
6. Store last login timestamp
7. Reset login attempts
8. Return token to client

**Postconditions:** User authenticated, JWT token issued, session active  
**Priority:** High  
**Status:** ⏳ Needs Route Implementation

#### FR-1.3: Profile Management
**Description:** Users can update their profile information and avatar  
**Actors:** Authenticated users  
**Preconditions:** User logged in  
**Endpoints:**
- GET `/api/auth/me` - Get current user profile
- PUT `/api/auth/profile` - Update profile
- POST `/api/auth/upload-avatar` - Upload profile picture

**Avatar Requirements:**
- Max file size: 5MB
- Allowed formats: JPG, PNG, WebP
- Auto-resize to 300x300px
- Stored in `/uploads/profiles/` directory

**Priority:** Medium  
**Status:** ⏳ Needs Route Implementation

### 4.2 Exam Management Module

#### FR-2.1: Create Exam
**Description:** Admins can create new examinations  
**Actors:** Admin users  
**Preconditions:** User has admin role, valid exam data provided  
**Request Body:**
```json
{
  "title": "String (100 chars max)",
  "description": "String (500 chars max)",
  "subject": "String",
  "duration": "Number (1-480 minutes)",
  "totalQuestions": "Number (minimum 1)",
  "passingScore": "Number (0-100)",
  "questions": [
    {
      "text": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Number (0-based index)",
      "difficulty": "Easy|Medium|Hard",
      "points": "Number",
      "explanation": "Optional explanation"
    }
  ],
  "instructions": "Exam instructions text",
  "settings": {
    "shuffleQuestions": "Boolean",
    "shuffleOptions": "Boolean",
    "showResults": "Boolean",
    "allowReview": "Boolean",
    "maxTabSwitches": "Number",
    "lockdownMode": "Boolean",
    "webcamRequired": "Boolean"
  }
}
```

**Validation Rules:**
- Title must be 2-100 characters
- At least 1 question required
- Passing score must be 0-100
- Duration must be 1-480 minutes
- All questions must have 4 options
- Correct answer must be valid index

**Response:** Created exam object with ID  
**Priority:** High  
**Status:** ⏳ Needs Route Implementation

#### FR-2.2: Edit Exam
**Description:** Admins can modify existing exams (only if not active)  
**Actors:** Admin users  
**Preconditions:** Exam exists, hasn't been activated yet  
**Restrictions:** Cannot edit active or completed exams  
**Endpoint:** PUT `/api/exams/{examId}`  
**Priority:** High  
**Status:** ⏳ Needs Route Implementation

#### FR-2.3: Publish/Activate Exam
**Description:** Admins can activate exams to make them available for students  
**Actors:** Admin users  
**Preconditions:** Exam has questions, status is 'draft' or 'scheduled'  
**Endpoint:** POST `/api/exams/{examId}/publish`  
**Changes:**
- Status changes to 'active'
- startTime set to current time
- endTime calculated as startTime + duration
- Students can now access exam

**Priority:** High  
**Status:** ⏳ Needs Route Implementation

#### FR-2.4: Enroll Students
**Description:** Admins can enroll students in specific exams  
**Actors:** Admin users  
**Preconditions:** Exam and students exist  
**Endpoints:**
- POST `/api/exams/{examId}/enroll` - Enroll single student
- POST `/api/exams/{examId}/bulk-enroll` - Bulk enroll students

**Bulk Enrollment Format:**
```json
{
  "userIds": [1, 2, 3, 4, 5],
  "emailAddresses": ["student1@example.com", "student2@example.com"]
}
```

**Priority:** High  
**Status:** ⏳ Needs Route Implementation

### 4.3 Exam Taking Module

#### FR-3.1: Start Exam
**Description:** Students can begin taking an exam  
**Actors:** Enrolled students  
**Preconditions:** Exam is active, student is enrolled, exam time hasn't passed  
**Endpoint:** POST `/api/exams/{examId}/start`  
**Actions:**
1. Validate student enrollment and eligibility
2. Create exam session record
3. Shuffle questions if enabled
4. Shuffle options if enabled
5. Start countdown timer
6. Enable security monitoring

**Response:**
```json
{
  "sessionId": "UUID",
  "examId": 1,
  "questions": [...],
  "duration": 60,
  "timeRemaining": 3600,
  "allowedTabSwitches": 3,
  "tabSwitchesMade": 0
}
```

**Priority:** Critical  
**Status:** ⏳ Needs Route Implementation

#### FR-3.2: Answer Question
**Description:** Students can select and change answers during exam  
**Actors:** Exam-taking students  
**Preconditions:** Exam session active, time not expired  
**Endpoint:** POST `/api/exams/{examId}/answers`  
**Payload:**
```json
{
  "questionIndex": 0,
  "selectedAnswer": 2,
  "timeSpent": 45
}
```

**Behavior:**
- Auto-save answers every 30 seconds
- Track time spent per question
- Prevent double-submission of same answer
- Validate answer index (0-3)

**Priority:** Critical  
**Status:** ⏳ Needs Route Implementation

#### FR-3.3: Submit Exam
**Description:** Students submit completed exam for grading  
**Actors:** Exam-taking students  
**Preconditions:** Exam session active or time expired  
**Endpoint:** POST `/api/exams/{examId}/submit`  
**Actions:**
1. Calculate total score
2. Calculate percentage (score/total × 100)
3. Determine pass/fail based on passing score
4. Generate certificate if passed (FR-4.1)
5. Record completion timestamp
6. Send notification
7. Clean up exam session

**Response:**
```json
{
  "examId": 1,
  "studentId": 1,
  "totalQuestions": 50,
  "correctAnswers": 42,
  "score": 84,
  "percentage": 84,
  "passed": true,
  "certificateId": 123,
  "submittedAt": "2026-02-25T10:30:00Z"
}
```

**Auto-submission:** If time expires, automatically submit  
**Priority:** Critical  
**Status:** ⏳ Needs Route Implementation

#### FR-3.4: Security Monitoring
**Description:** System monitors for cheating attempts during exam  
**Actors:** System (automatic)  
**Monitoring includes:**
- **Tab Switching:** Detect when student switches browser tabs
- **Copy/Paste:** Prevent copying exam questions
- **Right-click:** Disable context menu in exam
- **Screenshot:** Prevent screenshots during exam
- **Focus Loss:** Track when browser window loses focus
- **Full-screen:** Encourage full-screen mode (optional)

**Violation Logging:**
```javascript
{
  "sessionId": "UUID",
  "violationType": "tab_switch|copy_paste|right_click|screenshot|focus_loss",
  "timestamp": "2026-02-25T10:30:00Z",
  "description": "Optional details"
}
```

**Actions on Violation:**
- Log violation in database
- Display warning to student
- After 3+ violations, allow submission with warning
- Notification to admin about violations

**Priority:** High  
**Status:** ⏳ Needs Frontend Implementation

### 4.4 Certificate Management Module

#### FR-4.1: Generate Certificate
**Description:** Automatically generate certificate when exam is passed  
**Actors:** System (automatic on exam submission)  
**Preconditions:** Exam submitted, percentage ≥ passing score  
**Automatic Triggers:**
- Triggered immediately after exam submission if passed
- Called by ExamService.submitExam()
- Creates Certificate record

**Certificate Data:**
```javascript
{
  certificateId: "CERT-automated-unique-id",
  studentId: 1,
  examId: 1,
  issuedById: 1, // Admin who created exam
  score: 85,
  grade: "A", // Auto-calculated from score
  status: "issued",
  issuedDate: "2026-02-25T10:30:00Z",
  expiryDate: "2027-02-25T10:30:00Z", // 1 year
  verificationCode: "UNIQUE-CODE-FOR-VERIFICATION",
  certificateUrl: "/certificates/CERT-ID.pdf",
  qrCode: "Generated QR code URL"
}
```

**Grade Mapping:**
| Score Range | Grade |
|------------|-------|
| 95-100 | A+ |
| 90-94 | A |
| 85-89 | B+ |
| 80-84 | B |
| 75-79 | C+ |
| 70-74 | C |
| 60-69 | D |
| Below 60 | F |

**Priority:** High  
**Status:** ⏳ Needs Route Implementation

#### FR-4.2: Verify Certificate
**Description:** Anyone can verify certificate authenticity  
**Actors:** Public (no authentication required)  
**Endpoint:** GET `/api/certificates/verify/{verificationCode}`  
**Validation Rules:**
- Verification code must exist
- Certificate status = "issued"
- Current date < expiryDate
- Not revoked

**Response:**
```json
{
  "valid": true,
  "certificateId": "CERT-...",
  "studentName": "John Doe",
  "examTitle": "React Fundamentals",
  "issuedDate": "2026-02-25",
  "expiryDate": "2027-02-25",
  "score": 85,
  "grade": "A"
}
```

**Priority:** Medium  
**Status:** ⏳ Needs Route Implementation

#### FR-4.3: Download Certificate
**Description:** Students can download their certificates as PDF  
**Actors:** Certificate owners  
**Preconditions:** User authenticated, owns certificate  
**Endpoint:** GET `/api/certificates/{certificateId}/download`  
**Actions:**
1. Verify ownership and validity
2. Generate PDF if not cached
3. Track download (increment counter, record timestamp)
4. Send PDF file to client
5. Log download in audit trail

**PDF Template includes:**
- School/Organization logo
- Student name
- Exam title and subject
- Score and grade
- Issue and expiry dates
- Verification QR code
- Signature placeholder
- Verification code

**Priority:** High  
**Status:** ⏳ Needs Route Implementation

#### FR-4.4: Revoke Certificate
**Description:** Admins can revoke issued certificates  
**Actors:** Admin users  
**Preconditions:** Certificate exists, status = "issued"  
**Endpoint:** POST `/api/certificates/{certificateId}/revoke`  
**Payload:**
```json
{
  "reason": "Score verification failed | Student appeal | Academic integrity violation"
}
```

**Actions:**
1. Change status to "revoked"
2. Store revocation reason
3. Record revocation timestamp
4. Notify student via email
5. Log in audit trail

**Verification will fail after revocation**  
**Priority:** Medium  
**Status:** ⏳ Needs Route Implementation

### 4.5 Analytics Module

#### FR-5.1: Student Analytics
**Description:** Students can view their exam performance  
**Actors:** Students  
**Endpoints:**
- GET `/api/analytics/my-performance` - Personal dashboard
- GET `/api/analytics/exam/{examId}` - Specific exam analysis
- GET `/api/analytics/history` - Exam history with pagination

**Student Dashboard Data:**
```json
{
  "totalExamsTaken": 5,
  "passingRate": 80,
  "averageScore": 78.5,
  "examsInProgress": 1,
  "certificatesEarned": 4,
  "recentExams": [...],
  "performanceTrend": [...]
}
```

**Exam Analysis:**
```json
{
  "examId": 1,
  "title": "React Fundamentals",
  "attemptNumber": 2,
  "score": 85,
  "percentage": 85,
  "timeTaken": 45,
  "totalTime": 60,
  "questionsCorrect": 42,
  "questionsTotal": 50,
  "tabSwitches": 2,
  "violationsDetected": 0,
  "questionAnalysis": [
    {
      "questionIndex": 0,
      "difficulty": "Easy",
      "timeSpent": 30,
      "isCorrect": true,
      "explanation": "..."
    }
  ],
  "passed": true,
  "certificateId": 123
}
```

**Priority:** High  
**Status:** ⏳ Needs Route Implementation

#### FR-5.2: Admin Analytics
**Description:** Admins view comprehensive exam and student analytics  
**Actors:** Admin users  
**Endpoints:**
- GET `/api/analytics/dashboard` - System overview
- GET `/api/analytics/exams` - Exam statistics
- GET `/api/analytics/students` - Student performance
- GET `/api/analytics/trends` - Historical trends

**Admin Dashboard:**
```json
{
  "systemMetrics": {
    "totalUsers": 500,
    "activeStudents": 120,
    "totalExams": 25,
    "activeExams": 3,
    "certificatesIssued": 450,
    "systemUptime": "99.9%"
  },
  "examMetrics": [
    {
      "examId": 1,
      "title": "React Fundamentals",
      "totalParticipants": 100,
      "averageScore": 76.5,
      "passRate": 75,
      "averageTime": 45.2,
      "difficultyStats": {
        "easy": { "correct": 95, "total": 100 },
        "medium": { "correct": 75, "total": 100 },
        "hard": { "correct": 50, "total": 100 }
      }
    }
  ],
  "studentPerformance": [...],
  "trends": {
    "chartData": [...],
    "monthlyTrend": [...]
  }
}
```

**Priority:** High  
**Status:** ⏳ Needs Route Implementation

### 4.6 Notification Module

#### FR-6.1: Send Notifications
**Description:** System sends notifications via multiple channels  
**Actors:** System (automatic), Admin (manual)  
**Notification Types:**
- **Exam Reminders:** 24 hours before exam
- **Exam Started:** When admin activates exam
- **Time Warnings:** 15, 5, 1 minutes remaining
- **Results:** After exam submission
- **Certificate Issued:** When certificate generated
- **System Announcements:** From admin

**Notification Channels:**
1. **In-App:** Stored in notifications table, displayed in UI
2. **Email:** Via Nodemailer SMTP
3. **Push:** (Future: Web push notifications)

**Endpoint to Create Notification:**
POST `/api/notifications`
```json
{
  "title": "Exam Reminder",
  "message": "Your React exam starts in 24 hours",
  "type": "exam",
  "priority": "high",
  "recipientId": 1,
  "relatedExamId": 1,
  "metadata": {
    "actionUrl": "/exams/1",
    "actionText": "Go to Exam"
  }
}
```

**Priority:** High  
**Status:** ⏳ Needs Route Implementation

#### FR-6.2: Notification Center
**Description:** Students view all their notifications  
**Actors:** Authenticated users  
**Endpoints:**
- GET `/api/notifications` - Get all notifications (paginated)
- GET `/api/notifications?unread=true` - Unread only
- PUT `/api/notifications/{id}/read` - Mark as read
- PUT `/api/notifications/read-all` - Mark all as read
- DELETE `/api/notifications/{id}` - Delete notification

**Notification Object:**
```json
{
  "id": 1,
  "title": "String",
  "message": "String",
  "type": "info|success|warning|danger|exam|certificate|system",
  "priority": "low|medium|high|urgent",
  "isRead": false,
  "readAt": null,
  "createdAt": "2026-02-25T10:30:00Z",
  "metadata": {...}
}
```

**Auto-cleanup:** Notifications older than 30 days auto-deleted  
**Priority:** Medium  
**Status:** ⏳ Needs Route Implementation

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Performance Requirements

| Requirement | Target | Priority |
|------------|--------|----------|
| API Response Time | < 200ms (95th percentile) | Critical |
| Database Query Time | < 100ms | Critical |
| Page Load Time | < 2 seconds | High |
| Concurrent Users | 1000+ simultaneous exams | High |
| Throughput | 100+ requests/second | High |
| Cache Hit Ratio | > 80% | Medium |

**Performance Implementation:**
- [x] Gzip compression enabled
- [x] Connection pooling (Sequelize)
- [ ] Redis caching layer (Future)
- [ ] CDN for static assets
- [ ] Database query optimization with indexes
- [ ] Pagination for large datasets

### 5.2 Security Requirements

#### Authentication & Authorization
- [x] JWT-based stateless authentication
- [x] Password hashing with bcryptjs (12 rounds)
- [x] Account lockout after 5 failed attempts (2 hours)
- [x] Secure cookie settings (httpOnly, secure, sameSite)
- [ ] Optional 2FA (Future)
- [x] Role-based access control (Student, Admin)

#### Data Protection
- [x] HTTPS/TLS encryption in transit (production)
- [x] Password minimum 6 characters (enforced)
- [x] SQL injection prevention (Sequelize ORM)
- [x] XSS protection (Helmet.js)
- [x] CSRF protection via SameSite cookies
- [ ] Data encryption at rest (Future)

#### API Security
- [x] Rate limiting (100 req/15min, 5 auth req/15min)
- [x] Input validation (Joi + express-validator)
- [x] Secure headers (Helmet.js)
- [x] CORS with origin whitelist
- [x] API authentication required (JWT)
- [ ] API key management (Future)

### 5.3 Reliability & Availability

| Requirement | Target | Priority |
|------------|--------|----------|
| System Uptime | 99.9% | High |
| Mean Time to Recovery | < 1 hour | High |
| Data Backup Frequency | Daily | High |
| Backup Retention | 30 days | High |
| Disaster Recovery Plan | Documented | High |

**Reliability Features:**
- [x] Graceful error handling
- [x] Database connection redundancy
- [x] Transaction support for critical operations
- [ ] Automated failover (Future)
- [ ] Load balancer (Future for multiple instances)

### 5.4 Scalability Requirements

**Horizontal Scaling:**
- Stateless API backend (can run multiple instances)
- Shared MySQL database
- Session storage in database (not memory)
- File uploads to shared storage

**Vertical Scaling:**
- Database connection pooling
- Query optimization
- Efficient indexing
- Pagination for large datasets

**Load Testing:**
- [ ] Test 1000 concurrent users
- [ ] Test 500 concurrent exams
- [ ] Sustained 100 req/sec load
- [ ] Database stress test

### 5.5 Maintainability & Testability

#### Code Quality
- [ ] Unit test coverage: > 80%
- [ ] Integration test coverage: > 60%
- [ ] ESLint compliance
- [ ] Code documentation (JSDoc)
- [ ] API documentation (Swagger/OpenAPI)

#### Testing Strategy
- **Unit Tests:** Individual service functions
- **Integration Tests:** Full API endpoint tests
- **E2E Tests:** Complete user workflows
- **Security Tests:** Penetration testing

#### Monitoring & Logging
- [x] Winston logging (combined + error logs)
- [x] Request/response logging
- [x] Error tracking and reporting
- [ ] Monitoring dashboard (Datadog/New Relic)
- [ ] Alerting on errors/performance degradation

---

## 6. SYSTEM ARCHITECTURE

### 6.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           React SPA (Frontend)                    │  │
│  │  - LoginView, StudentDashboard, ExamView         │  │
│  │  - ResultsView, BulkCertificateGenerator         │  │
│  │  - Uses Tailwind CSS + Lucide Icons              │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/HTTPS
                   │ REST API
┌──────────────────▼──────────────────────────────────────┐
│                  API LAYER (Express.js)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Route Handlers                      │  │
│  │  - /api/auth (Login, Register, Profile)         │  │
│  │  - /api/exams (Create, List, Start, Submit)     │  │
│  │  - /api/certificates (Generate, Verify)         │  │
│  │  - /api/notifications (Get, Mark Read)          │  │
│  │  - /api/analytics (Student, Admin)              │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Middleware Stack                        │  │
│  │  - Auth Middleware (JWT verification)           │  │
│  │  - Rate Limiting (express-rate-limit)           │  │
│  │  - Request Validation (express-validator)       │  │
│  │  - Error Handler (Custom error classes)         │  │
│  │  - CORS, Helmet, Compression                    │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐  ┌────────▼────────┐
│ SERVICE LAYER  │  │  UTILITY LAYER  │
│                │  │                 │
│ UserService    │  │ Error Classes   │
│ ExamService    │  │ Logger (Winston)│
│ CertService    │  │ Config (Joi)    │
│ NotifService   │  │ Validators      │
└────────┬────────┘  └─────────────────┘
         │
┌────────▼──────────────────────────────┐
│        DATABASE ACCESS LAYER           │
│                                       │
│  Sequelize ORM Models:                │
│  - User                               │
│  - Exam                               │
│  - Certificate                        │
│  - Notification                       │
└────────┬──────────────────────────────┘
         │ MySQL Protocol
┌────────▼──────────────────────────────┐
│        MySQL Database 8.0             │
│                                       │
│  Tables:                              │
│  - users                              │
│  - exams                              │
│  - certificates                       │
│  - notifications                      │
└───────────────────────────────────────┘
```

### 6.2 Request/Response Flow

```
1. USER REQUEST (Frontend)
   ↓
   POST /api/exams/{id}/submit
   Headers: { Authorization: "Bearer JWT_TOKEN" }
   Body: { answers: [...] }
   
2. MIDDLEWARE PROCESSING
   ↓
   - CORS validation
   - Rate limiting check
   - JWT verification
   - Request validation
   - Set req.user context
   
3. ROUTE HANDLER
   ↓
   router.post('/submit', async (req, res, next) => {
     const result = await ExamService.submitExam(...);
     res.json(result);
   });
   
4. SERVICE LAYER (Business Logic)
   ↓
   ExamService.submitExam(examId, userId, answers)
   - Calculate score
   - Determine pass/fail
   - Generate certificate
   - Update analytics
   - Return result
   
5. DATABASE ACCESS
   ↓
   Sequelize ORM:
   - Exam.findByPk(examId)
   - Certificate.create({...})
   - User.update({...})
   - Notification.create({...})
   
6. RESPONSE TO CLIENT
   ↓
   {
     "success": true,
     "data": {
       "examId": 1,
       "score": 85,
       "passed": true,
       "certificateId": 123
     }
   }
```

---

## 7. DATABASE DESIGN

### 7.1 Entity Relationship Diagram

```
        ┌─────────────┐
        │    Users    │
        ├─────────────┤
        │ id (PK)     │
        │ email       │◄────┐
        │ password    │     │ One-to-Many
        │ role        │     │
        │ ...         │     │
        └─────────────┘     │
              │             │
              │ One-to-Many │
              │             │
        ┌─────▼────────┐   ┌─▼──────────────┐
        │   Exams      │   │ Certificates   │
        ├──────────────┤   ├────────────────┤
        │ id (PK)      │   │ id (PK)        │
        │ title        │   │ studentId (FK) │
        │ questions    │───│ examId (FK)    │
        │ createdById  │   │ issuedById     │
        │ ...          │   │ score, grade   │
        └──────────────┘   │ ...            │
              │            └────────────────┘
              │
              │ One-to-Many
              │
        ┌─────▼──────────────┐
        │ Notifications      │
        ├────────────────────┤
        │ id (PK)            │
        │ recipientId (FK)   │
        │ senderId (FK)      │
        │ relatedExamId (FK) │
        │ relatedCertId (FK) │
        │ ...                │
        └────────────────────┘
```

### 7.2 Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') DEFAULT 'student',
  avatar VARCHAR(255),
  isActive BOOLEAN DEFAULT true,
  lastLogin DATETIME,
  loginAttempts INT DEFAULT 0,
  lockUntil DATETIME,
  preferences JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_isActive (isActive)
);
```

#### Exams Table
```sql
CREATE TABLE exams (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  subject VARCHAR(50) NOT NULL,
  duration INT NOT NULL, -- minutes
  totalQuestions INT NOT NULL,
  passingScore INT NOT NULL, -- percentage
  questions JSON NOT NULL, -- array of question objects
  status ENUM('draft', 'scheduled', 'active', 'completed', 'cancelled') DEFAULT 'draft',
  scheduledDate DATETIME,
  startTime DATETIME,
  endTime DATETIME,
  instructions TEXT,
  settings JSON, -- exam settings (shuffle, lockdown, etc)
  createdById INT UNSIGNED NOT NULL,
  analytics JSON, -- performance stats
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (createdById) REFERENCES users(id),
  INDEX idx_status_date (status, scheduledDate),
  INDEX idx_createdBy (createdById)
);
```

#### Certificates Table
```sql
CREATE TABLE certificates (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  certificateId VARCHAR(100) UNIQUE NOT NULL,
  studentId INT UNSIGNED NOT NULL,
  examId INT UNSIGNED NOT NULL,
  score INT NOT NULL,
  grade ENUM('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F') NOT NULL,
  status ENUM('issued', 'revoked', 'expired') DEFAULT 'issued',
  issuedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiryDate DATETIME NOT NULL,
  issuedById INT UNSIGNED NOT NULL,
  certificateUrl VARCHAR(255) NOT NULL,
  qrCode VARCHAR(255),
  verificationCode VARCHAR(50) UNIQUE NOT NULL,
  metadata JSON,
  downloadCount INT DEFAULT 0,
  lastDownloaded DATETIME,
  emailSent BOOLEAN DEFAULT false,
  emailSentAt DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES users(id),
  FOREIGN KEY (examId) REFERENCES exams(id),
  FOREIGN KEY (issuedById) REFERENCES users(id),
  INDEX idx_student_exam (studentId, examId),
  INDEX idx_certificateId (certificateId),
  INDEX idx_verificationCode (verificationCode),
  INDEX idx_status_expiry (status, expiryDate)
);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'danger', 'exam', 'certificate', 'system') DEFAULT 'info',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  recipientId INT UNSIGNED NOT NULL,
  senderId INT UNSIGNED,
  relatedExamId INT UNSIGNED,
  relatedCertificateId INT UNSIGNED,
  isRead BOOLEAN DEFAULT false,
  readAt DATETIME,
  emailSent BOOLEAN DEFAULT false,
  emailSentAt DATETIME,
  pushSent BOOLEAN DEFAULT false,
  pushSentAt DATETIME,
  scheduledFor DATETIME,
  expiresAt DATETIME,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recipientId) REFERENCES users(id),
  FOREIGN KEY (senderId) REFERENCES users(id),
  FOREIGN KEY (relatedExamId) REFERENCES exams(id),
  FOREIGN KEY (relatedCertificateId) REFERENCES certificates(id),
  INDEX idx_recipient_read (recipientId, isRead, createdAt),
  INDEX idx_expiresAt (expiresAt),
  INDEX idx_scheduledFor (scheduledFor)
);
```

---

## 8. API SPECIFICATION

### 8.1 Authentication Endpoints

#### POST /api/auth/register
**Description:** Register new user  
**Access:** Public  
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```
**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    }
  }
}
```
**Status:** ⏳ Needs Implementation

#### POST /api/auth/login
**Description:** Authenticate user  
**Access:** Public  
**Request:**
```json
{
  "email": "admin@secureexam.com",
  "password": "admin123"
}
```
**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "data": {
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@secureexam.com",
      "role": "admin"
    }
  }
}
```
**Status:** ⏳ Needs Implementation

#### GET /api/auth/me
**Description:** Get current user profile  
**Access:** Protected (JWT)  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "avatar": "/uploads/profiles/avatar-1.jpg"
  }
}
```
**Status:** ⏳ Needs Implementation

#### POST /api/auth/upload-avatar
**Description:** Upload profile picture  
**Access:** Protected  
**Content-Type:** multipart/form-data  
**Response (200):**
```json
{
  "success": true,
  "data": {
    "avatar": "/uploads/profiles/profile-1-timestamp.jpg"
  }
}
```
**Status:** ⏳ Needs Implementation

### 8.2 Exam Endpoints

#### POST /api/exams
**Description:** Create new exam  
**Access:** Admin only  
**Status:** ⏳ Needs Implementation

#### GET /api/exams
**Description:** List exams with filtering  
**Access:** Protected  
**Query Parameters:** ?status=active&page=1&limit=10  
**Status:** ⏳ Needs Implementation

#### POST /api/exams/{examId}/publish
**Description:** Activate exam  
**Access:** Admin only  
**Status:** ⏳ Needs Implementation

#### POST /api/exams/{examId}/start
**Description:** Start taking exam  
**Access:** Enrolled students  
**Status:** ⏳ Needs Implementation

#### POST /api/exams/{examId}/submit
**Description:** Submit exam answers  
**Access:** Exam-taking students  
**Status:** ⏳ Needs Implementation

(Complete API specification in PRODUCTION_DEPLOYMENT.md sections 9-12)

---

## 9. DEVELOPMENT TASKS & CURRENT STATUS

### 9.1 Completed Tasks ✅

#### Phase 1: Infrastructure & Configuration (100%)
- [x] Setup MySQL + Sequelize ORM
- [x] Create configuration system (Joi validation)
- [x] Setup logging (Winston)
- [x] Create error handling classes
- [x] Update Docker compose for MySQL
- [x] Create environment templates

#### Phase 2: Database Models (100%)
- [x] User model with password hashing
- [x] Exam model with JSON questions
- [x] Certificate model with auto-generation
- [x] Notification model
- [x] Model associations and relationships

#### Phase 3: Service Layer (100%)
- [x] UserService (authentication, profile)
- [x] ExamService (exam operations)
- [x] CertificateService (generation, verification)
- [x] NotificationService (send, retrieve)

#### Phase 4: Documentation (100%)
- [x] SETUP_MYSQL.md (Quick start)
- [x] PRODUCTION_DEPLOYMENT.md (Full guide)
- [x] MIGRATION_GUIDE.md (MongoDB→MySQL)
- [x] UPGRADE_SUMMARY.md (Changes summary)

### 9.2 In-Progress Tasks ⏳

#### Phase 5: Route Implementation (0%)

**Route Files to Update (6 files):**

1. **backend/routes/auth.js** (HIGH PRIORITY)
   - [ ] POST /api/auth/register - Use UserService.createUser()
   - [ ] POST /api/auth/login - Use UserService.findForAuth() + password verify
   - [ ] GET /api/auth/me - Return current user
   - [ ] PUT /api/auth/profile - Use UserService.updateUser()
   - [ ] POST /api/auth/upload-avatar - Handle file upload
   - **Est. Time:** 2-3 hours

2. **backend/routes/exams.js** (HIGH PRIORITY)
   - [ ] POST /api/exams - Use ExamService.createExam()
   - [ ] GET /api/exams - Use ExamService.getAllExams()
   - [ ] GET /api/exams/:id - Use ExamService.getExamById()
   - [ ] PUT /api/exams/:id - Use ExamService.updateExam()
   - [ ] POST /api/exams/:id/publish - Use ExamService.publishExam()
   - [ ] POST /api/exams/:id/enroll - Student enrollment
   - [ ] POST /api/exams/:id/start - Start exam session
   - [ ] POST /api/exams/:id/submit - Use ExamService.submitExam()
   - **Est. Time:** 3-4 hours

3. **backend/routes/certificates.js** (HIGH PRIORITY)
   - [ ] GET /api/certificates - Use CertificateService.getUserCertificates()
   - [ ] GET /api/certificates/:id - Use CertificateService.getCertificateById()
   - [ ] GET /api/certificates/verify/:code - Use CertificateService.verifyCertificate()
   - [ ] POST /api/certificates/:id/revoke - Use CertificateService.revokeCertificate()
   - [ ] GET /api/certificates/:id/download - Use CertificateService.downloadCertificate()
   - **Est. Time:** 2 hours

4. **backend/routes/notifications.js** (MEDIUM PRIORITY)
   - [ ] GET /api/notifications - Use NotificationService.getUserNotifications()
   - [ ] PUT /api/notifications/:id/read - Use NotificationService.markAsRead()
   - [ ] PUT /api/notifications/read-all - Use NotificationService.markAllAsRead()
   - [ ] DELETE /api/notifications/:id - Use NotificationService.deleteNotification()
   - [ ] GET /api/notifications/unread-count - Use NotificationService.getUnreadCount()
   - **Est. Time:** 1.5 hours

5. **backend/routes/analytics.js** (MEDIUM PRIORITY)
   - [ ] GET /api/analytics/dashboard - Admin overview
   - [ ] GET /api/analytics/my-performance - Student dashboard
   - [ ] GET /api/analytics/exams - Exam statistics
   - [ ] GET /api/analytics/exam/:id - Specific exam analysis
   - [ ] GET /api/analytics/history - Exam history with pagination
   - **Est. Time:** 2-3 hours

6. **backend/routes/students.js** (MEDIUM PRIORITY)
   - [ ] GET /api/students - List all students (admin)
   - [ ] GET /api/students/:id - User profile
   - [ ] GET /api/students/:id/exams - Student exam history
   - [ ] GET /api/students/:id/certificates - Student certificates
   - **Est. Time:** 1.5 hours

**Total Est. Time for Routes:** 12-15 hours

#### Phase 6: Middleware Updates (CRITICAL)

**backend/middleware/auth.js** (1 hour)
- [ ] Update JWT payload handling
- [ ] Change `req.user._id` to `req.user.id`
- [ ] Verify role-based access control works
- [ ] Test protected routes

### 9.3 Testing Phase (0%)

**Unit Tests** (8-10 hours)
- [ ] UserService tests
- [ ] ExamService tests
- [ ] CertificateService tests
- [ ] NotificationService tests
- [ ] Error handling tests

**Integration Tests** (5-6 hours)
- [ ] Auth endpoints integration
- [ ] Exam flow (create → start → submit)
- [ ] Certificate generation workflow
- [ ] Database transactions

**E2E Tests** (3-4 hours)
- [ ] Complete student exam workflow
- [ ] Admin exam management workflow
- [ ] Certificate verification workflow

### 9.4 Frontend Updates (0%)

**Optional Updates** (2-3 hours)
- [ ] Update API calls to use `id` instead of `_id`
- [ ] Update response handling for new format
- [ ] Test all components with new API

---

## 10. TESTING REQUIREMENTS

### 10.1 Test Coverage Goals

| Component | Target Coverage | Status |
|-----------|-----------------|--------|
| Services | 90% | ⏳ Pending |
| Routes | 85% | ⏳ Pending |
| Utilities | 95% | ⏳ Pending |
| Middleware | 80% | ⏳ Pending |
| **Overall** | **80%** | ⏳ Pending |

### 10.2 Test Scenarios

#### Authentication Tests
```javascript
✓ Register with valid credentials
✗ Register with existing email (should throw ConflictError)
✓ Login with valid credentials
✗ Login with invalid password (should increment attempts)
✗ Login after 5 attempts (should lock account)
✓ Account unlock after 2 hours
✓ JWT token verification
✓ Protected route access control
```

#### Exam Tests
```javascript
✓ Create exam with valid questions
✗ Create exam without questions (should fail)
✓ Publish exam (changes status to 'active')
✗ Edit published exam (should fail)
✓ Enroll student in exam
✓ Start exam (creates session)
✓ Submit exam with answers
✓ Score calculation
✓ Pass/fail determination
```

#### Certificate Tests
```javascript
✓ Auto-generate on exam pass
✗ Not generated on exam fail
✓ Verify with valid code
✗ Verify with revoked certificate
✓ Download certificate
✓ Revoke certificate
✓ Grade assignment based on score
```

---

## 11. DEPLOYMENT REQUIREMENTS

### 11.1 System Requirements

**Development Environment:**
- Node.js 18+
- MySQL 8.0+
- npm 8+
- Docker & Docker Compose
- Windows/Mac/Linux

**Production Environment:**
- Ubuntu 20.04+ or equivalent
- 4GB+ RAM
- 20GB+ storage
- Node.js 18+
- MySQL 8.0+ or RDS
- Nginx or Apache (reverse proxy)
- Let's Encrypt SSL certificate

### 11.2 Deployment Checklist

**Pre-Deployment:**
- [ ] All code merged to main branch
- [ ] All tests passing (80%+ coverage)
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Performance testing completed

**Deployment:**
- [ ] Database migrations executed
- [ ] Environment variables configured
- [ ] Docker image built and tested
- [ ] SSL certificate installed
- [ ] Health checks configured
- [ ] Backup strategy enabled

**Post-Deployment:**
- [ ] Application accessible via domain
- [ ] All endpoints responding correctly
- [ ] Logging configured and working
- [ ] Monitoring/alerting active
- [ ] Team trained on operations

---

## 12. DEVELOPER CONTRIBUTION GUIDE

### 12.1 How Developers Can Contribute

**To Get Started:**
1. Fork/Clone the repository
2. Read this SRS.md thoroughly
3. Review [SETUP_MYSQL.md](./SETUP_MYSQL.md)
4. Setup local development environment
5. Pick a task from Section 9.2

**Task Selection Process:**
1. Review **Section 9.2 - In-Progress Tasks**
2. Pick incomplete route file or test
3. Comment on issue to claim it
4. Create feature branch: `feature/auth-routes` or `test/user-service`
5. Complete implementation following templates
6. Submit PR with test coverage

### 12.2 Code Standards

**Naming Conventions:**
```javascript
// Services (PascalCase, -Service suffix)
UserService, ExamService, CertificateService

// Methods (camelCase, descriptive)
createUser(), getUserById(), findForAuth()

// Routes (kebab-case, HTTP verb first)
POST /api/auth/register
GET /api/exams/:id
PUT /api/certificates/:id/revoke

// Variables (camelCase)
const userId = 1;
const examDuration = 60;

// Constants (UPPER_SNAKE_CASE)
const MAX_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_DURATION_MS = 2 * 60 * 60 * 1000;
```

**Error Handling Template:**
```javascript
// Import error classes
const { ValidationError, UnauthorizedError, NotFoundError } = require('../utils/errors');

// Throw appropriate errors
if (!email) throw new ValidationError('Email is required');
if (!user) throw new UnauthorizedError('Invalid credentials');
if (!exam) throw new NotFoundError('Exam not found');

// Error handler catches automatically
router.post('/login', async (req, res, next) => {
  // Any thrown error automatically caught and formatted
});
```

**Service Usage Template:**
```javascript
// In routes, always use Services, never direct model access
router.post('/exams', async (req, res, next) => {
  // CORRECT: Use service
  const exam = await ExamService.createExam(req.body, req.user.id);
  
  // WRONG: Don't access model directly
  // const exam = await Exam.create(req.body);
  
  res.status(201).json({ success: true, data: exam });
});
```

**Response Format:**
```javascript
// Success response
res.json({
  success: true,
  data: { /* response data */ }
});

// Error response (handled automatically)
throw new ValidationError('Error message');
// Automatically becomes:
// {
//   "success": false,
//   "message": "Error message",
//   "statusCode": 400
// }
```

### 12.3 PR Review Checklist

Before submitting a PR, ensure:
- [ ] All service calls used (no direct model access)
- [ ] Proper error handling with custom error classes
- [ ] Response format consistent with standard
- [ ] Status codes correct (201 for create, 200 for read/update, 204 for delete)
- [ ] Input validation before processing
- [ ] Comments for complex logic
- [ ] Unit tests included (min 30% of feature)
- [ ] No console.log (use logger instead)
- [ ] No hardcoded values (use config)
- [ ] No passwords/secrets in code
- [ ] ID field is `id` not `_id`

### 12.4 Common Tasks & How to Do Them

**Task 1: Implement a GET endpoint**
```javascript
// Template in backend/routes/exams.js
router.get('/:id', async (req, res, next) => {
  const exam = await ExamService.getExamById(req.params.id);
  res.json({ success: true, data: exam });
});
```

**Task 2: Implement a POST endpoint with validation**
```javascript
router.post('/', [
  body('title').trim().notEmpty().isLength({ max: 100 }),
  body('duration').isInt({ min: 1, max: 480 })
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }
  
  const exam = await ExamService.createExam(req.body, req.user.id);
  res.status(201).json({ success: true, data: exam });
});
```

**Task 3: Add tests**
```javascript
// backend/__tests__/services/UserService.test.js
describe('UserService', () => {
  test('createUser should hash password', async () => {
    const user = await UserService.createUser({
      name: 'John',
      email: 'john@example.com',
      password: 'password123'
    });
    
    expect(user.password).not.toBe('password123');
    expect(await bcrypt.compare('password123', user.password)).toBe(true);
  });
});
```

---

## 13. GLOSSARY & TERMINOLOGY

| Term | Definition |
|------|-----------|
| **JWT** | JSON Web Token - stateless authentication token |
| **SRS** | Software Requirements Specification - this document |
| **ORM** | Object-Relational Mapping (Sequelize maps DB to JS objects) |
| **RBAC** | Role-Based Access Control (Student vs Admin roles) |
| **API** | Application Programming Interface (REST endpoints) |
| **Endpoint** | A single API route (e.g., POST /api/exams) |
| **Middleware** | Function that processes requests before route handlers |
| **Service** | Business logic layer (UserService, ExamService, etc) |
| **Model** | Database schema (User, Exam, Certificate, Notification) |
| **Route** | HTTP endpoint definition (GET, POST, PUT, DELETE) |
| **Payload** | Data sent in request body |
| **Response** | Data returned by API |
| **Status Code** | HTTP response code (200, 201, 400, 401, 404, 500) |
| **Token** | JWT authentication token |
| **Session** | Active exam-taking activity |
| **Violation** | Security breach attempt (tab switch, copy-paste, etc) |

---

## 14. DEPENDENCIES & VERSIONS

### Core Dependencies
```json
{
  "express": "^4.18.2",
  "sequelize": "^6.35.2",
  "mysql2": "^3.6.5",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "dotenv": "^16.3.1",
  "joi": "^17.11.0",
  "winston": "^3.11.0",
  "multer": "^1.4.5-lts.1",
  "nodemailer": "^7.0.10",
  "express-rate-limit": "^6.10.0",
  "express-validator": "^7.0.1",
  "helmet": "^7.0.0",
  "cors": "^2.8.5",
  "compression": "^1.7.4",
  "morgan": "^1.10.0"
}
```

### Dev Dependencies (To Add)
```json
{
  "jest": "^29.7.0",
  "supertest": "^6.3.3",
  "nodemon": "^3.0.1",
  "eslint": "^8.x.x"
}
```

---

## 15. REVISION HISTORY

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-25 | Initial SRS document | Development Team |

---

## 16. CONTACT & SUPPORT

**Project Lead:** [Your Name]  
**Email:** [email@example.com]  
**GitHub Issues:** [Repository URL]/issues  
**Documentation:** See README.md and related guides  

**For Questions:**
1. Check project documentation
2. Review this SRS document
3. Check GitHub Issues for similar questions
4. Contact project lead

---

**End of Software Requirements Specification**

---

## 📋 QUICK REFERENCE: NEXT DEVELOPER STEPS

1. **Read This Document** - Understand overall requirements
2. **Run Local Setup** - Follow [SETUP_MYSQL.md](./SETUP_MYSQL.md)
3. **Pick a Task** - Choose from Section 9.2 (Route Implementation)
4. **Follow Code Standards** - Review Section 12.2
5. **Implement Feature** - Use service layer templates
6. **Add Tests** - At least 30% coverage
7. **Submit PR** - Reference this SRS in commit messages
8. **Celebrate!** 🎉

**Current Status:** 50% Complete - Ready for Route Implementation Phase

**Est. Timeline to Production:** 1-2 weeks with team contribution
