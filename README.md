# Quizzy - Complete Online Examination Platform

A comprehensive, secure online examination platform with real-time monitoring, e-certification, and advanced analytics. Built with React frontend and Node.js/Express backend.

## 🚀 Features

### 🔒 Security & Monitoring
- **Real-time Tab Switching Detection**: Monitors and logs attempts to switch tabs/windows during exams
- **Secure Browser Mode**: Prevents common cheating shortcuts
- **Continuous Security Monitoring**: Tracks user activity with alerts for suspicious behavior
- **JWT Authentication**: Secure token-based authentication system
- **Role-based Access Control**: Separate permissions for admins and students

### 👨‍🎓 User Management
- **Secure Authentication**: Encrypted password storage and secure login
- **User Registration**: Streamlined registration process
- **Profile Management**: User progress tracking and history
- **Session Management**: Automatic logout and token expiration

### 📊 Admin Panel (No-Code)
- **Dashboard Overview**: Real-time statistics and activity monitoring
- **Exam Management**: Create, edit, and manage examinations
- **Student Management**: Comprehensive student data and performance tracking
- **Certificate Management**: Automated certificate generation and distribution
- **Analytics Dashboard**: Detailed performance analysis and reporting

### 📝 Exam Features
- **Countdown Timer**: Visual timer with automatic warnings
- **Question Navigation**: Previous/Next question functionality
- **Answer Tracking**: Real-time answer saving and progress tracking
- **Auto-Submission**: Automatic submission on time expiry
- **Security Warnings**: Real-time alerts for detected violations

### 🏆 E-Certification
- **Automatic Generation**: Certificates generated upon passing exams
- **PDF Download**: Professional certificate downloads
- **Certificate Tracking**: Complete certificate history and management
- **Verification System**: Certificate authenticity verification

### 📈 Analytics & Reporting
- **Performance Analytics**: Individual and aggregate performance data
- **Question Analysis**: Difficulty assessment and success rates
- **Trend Analysis**: Historical performance trends
- **Real-time Dashboard**: Live statistics and monitoring

### 🔔 Notifications
- **Real-time Alerts**: Time warnings, security alerts, and system notifications
- **Email Notifications**: Exam reminders, results, and certificate issuance
- **In-app Notifications**: Live notification center with history
- **Scheduled Alerts**: Automated notification scheduling

## 🏗️ Architecture

```
secure-exam-platform/
├── frontend/              # React SPA
│   ├── src/
│   │   ├── api.js        # API service layer
│   │   ├── App.js        # Main application
│   │   └── components/   # Reusable components
│   └── package.json
└── backend/               # Node.js API
    ├── models/           # MongoDB schemas
    ├── routes/           # API endpoints
    ├── middleware/       # Auth & security
    └── server.js         # Express server
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with Hooks for state management
- **Tailwind CSS** for responsive styling
- **Lucide React** for icons
- **REST API** for backend communication

### Backend
- **Node.js** runtime environment
- **Express.js** web framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing

### Security & Monitoring
- **Helmet.js** for security headers
- **express-rate-limit** for rate limiting
- **CORS** for cross-origin requests
- **express-validator** for input validation

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas cloud database)
- npm or yarn

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secure-exam-platform
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file and configure:
   ```env
   # Database - Choose one of the following:
   
   # For local MongoDB installation:
   MONGODB_URI=mongodb://localhost:27017/secureexam
   
   # For MongoDB Atlas (cloud):
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/secureexam?retryWrites=true&w=majority
   
   # JWT Secret - Generate a secure random string:
   JWT_SECRET=your-secure-random-jwt-secret-here
   
   # Other settings (optional):
   PORT=5000
   NODE_ENV=development
   ```

4. **Setup Database**
   
   **Option A: Local MongoDB**
   - Install MongoDB Community Server from https://www.mongodb.com/try/download/community
   - Start MongoDB service
   - The app will connect automatically
   
   **Option B: MongoDB Atlas (Recommended for production)**
   - Create account at https://www.mongodb.com/atlas
   - Create a free cluster
   - Get connection string and update MONGODB_URI in .env

5. **Seed Database (Optional)**
   ```bash
   npm run seed  # Creates admin user and sample data
   ```
   
   Default admin credentials:
   - Email: admin@secureexam.com
   - Password: admin123

6. **Start Backend**
   ```bash
   npm run dev  # Development mode with nodemon
   # or
   npm start    # Production mode
   ```

7. **Setup Frontend** (in new terminal)
   ```bash
   cd ../frontend
   npm install
   npm start    # Starts on port 3000
   ```

8. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

### Testing the Setup

Run the API test script to verify everything is working:
```bash
cd backend
node test-api.js
```

## � Deployment

### Docker Deployment (Recommended)

The easiest way to deploy Quizzy is using Docker Compose:

1. **Prerequisites**
   - Docker and Docker Compose installed
   - At least 4GB RAM available

2. **Quick Deploy**
   ```bash
   # Clone and navigate to project
   git clone <repository-url>
   cd secure-exam-platform

   # Start all services
   docker-compose up -d
   ```

3. **Access**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:27017

### Production Deployment

For production environments:

1. **Use external MongoDB** (MongoDB Atlas)
2. **Configure environment variables** with production values
3. **Set up reverse proxy** (Nginx/Traefik) for HTTPS
4. **Enable monitoring** and health checks
5. **Configure backups** for database

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Cloud Platforms

Quizzy can be deployed to:
- **Vercel/Netlify** (Frontend only, with external backend)
- **Heroku** (Full stack)
- **AWS/DigitalOcean** (Docker containers)
- **Railway/Render** (Full stack with databases)

## �🔧 Development

### Available Scripts

**Backend:**
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests

**Frontend:**
- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Project Structure

```
secure-exam-platform/
├── backend/               # Node.js/Express API
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── middleware/       # Authentication & security
│   ├── seed.js           # Database seeding
│   ├── test-api.js       # API testing script
│   └── server.js         # Main server file
├── frontend/             # React SPA
│   ├── src/
│   │   ├── api.js       # API service layer
│   │   ├── App.js       # Main application
│   │   └── components/  # Reusable components
│   └── package.json
└── README.md
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile

### Exams
- `GET /api/exams` - Get all exams
- `POST /api/exams` - Create new exam
- `GET /api/exams/:id` - Get exam details
- `POST /api/exams/:id/start` - Start exam
- `POST /api/exams/:id/submit` - Submit exam

### Certificates
- `GET /api/certificates` - Get user certificates
- `POST /api/certificates/:examId/generate` - Generate certificate
- `GET /api/certificates/:id/download` - Download certificate

### Analytics
- `GET /api/analytics/overview` - Get system overview
- `GET /api/analytics/exams` - Get exam analytics
- `GET /api/analytics/users` - Get user analytics

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 rounds
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Protection**: Configured for secure cross-origin requests
- **Security Headers**: Helmet.js for enhanced security
- **Exam Monitoring**: Real-time tab switching detection

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin/student),
  isActive: Boolean,
  createdAt: Date
}
```

### Exam Model
```javascript
{
  title: String,
  description: String,
  questions: Array,
  duration: Number,
  passingScore: Number,
  status: String,
  createdBy: ObjectId,
  participants: Array
}
```

### Certificate Model
```javascript
{
  certificateId: String,
  student: ObjectId,
  exam: ObjectId,
  score: Number,
  grade: String,
  issuedDate: Date,
  expiryDate: Date
}
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Use PM2 or similar process manager

### Frontend Deployment
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Serve static files using nginx/apache
3. Configure API proxy for `/api` routes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in each folder
- Review the API documentation

---

## ✅ Dev verification & quick notes

These are the checks and small fixes performed during local development (verified on 2025-11-11):

- Seeded the database using `backend/seed.js`. The seeder creates an admin and sample students/exams/certificates/notifications.
   - Admin credentials: `admin@secureexam.com` / `admin123`
   - Sample student: `john@student.com` / `student123`

- Fixed a double-hashing issue in `backend/seed.js` (admin was previously double-hashed). The seeder now creates the admin with a plaintext password so the Mongoose pre-save hook hashes it once.

- Started backend on port 5000 and confirmed MongoDB connection using the `MONGODB_URI` in `backend/.env`.

- Added `.gitignore` to avoid committing `.env`, `node_modules`, uploads and build artifacts.

- Tested authentication endpoints and verified successful login for a seeded student and admin.

- Verified the avatar upload endpoint (`POST /api/auth/upload-avatar`) by uploading a test PNG with an authenticated student token — the endpoint accepted the file and updated the user's `avatar` field.

Security note: The repo contained a MongoDB Atlas connection string in `backend/.env`. If this repo is shared or pushed remotely, rotate the credentials in Atlas and update `backend/.env` immediately.

If you'd like, I can:
- Rotate the MongoDB credentials and update `.env`.
- Implement a frontend profile upload UI and wire it to the existing `/api/auth/upload-avatar` endpoint.
- Add a small integration test that uploads an avatar and asserts the user's `avatar` field is populated.


**Quizzy** - Making online examinations secure, reliable, and efficient.