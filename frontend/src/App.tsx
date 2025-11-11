// @ts-nocheck
// webhint-disable no-inline-styles
import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Shield, Award, BarChart3, Users, Settings, Bell, FileText, Lock, AlertTriangle, CheckCircle, X, Menu, LogOut, Download, Mail, Eye, EyeOff, TrendingUp, Activity, Zap, Loader2, Moon, Sun } from 'lucide-react';
import { authAPI, examsAPI, studentsAPI, certificatesAPI, analyticsAPI, notificationsAPI } from './api';
import LoginView from './components/LoginView';
import StudentDashboard from './components/StudentDashboard';
import ExamView from './components/ExamView';
import ResultsView from './components/ResultsView';
import BulkCertificateGenerator from './components/BulkCertificateGenerator';

// Type definitions
interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
}

interface ExamFormData {
  title: string;
  description: string;
  subject: string;
  duration: number;
  difficulty: string;
  totalQuestions: number;
  passingScore: number;
  questions: any[];
}

interface StudentFormData {
  name: string;
  email: string;
  password: string;
}

interface Notification {
  id: string | number;
  title?: string;
  message: string;
  type: string;
  timestamp: Date;
}

interface Analytics {
  totalExams?: number;
  totalStudents?: number;
  averageScore?: number;
  passRate?: number;
}

interface Certificate {
  id: string;
  studentId: string;
  examId: string;
  score: number;
  issuedAt: string;
  examTitle?: string;
  studentName?: string;
  certificateId?: string;
  date?: string;
}

interface Exam {
  id: string;
  _id?: string;
  title: string;
  description: string;
  subject: string;
  duration: number;
  difficulty: string;
  totalQuestions: number;
  passingScore: number;
  questions: any[];
  createdAt: string;
  status?: string;
  participants?: number;
  passRate?: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledExams: string[];
  certificates: string[];
  examStats?: {
    averageScore: number;
    totalCertificates: number;
    completedExams: number;
  };
}

interface ExamQuestion {
  id: string;
  _id?: string;
  question?: string;
  text?: string;
  options: string[];
  correctAnswer: number;
  difficulty?: string;
}

interface ExamResult {
  score: number;
  totalQuestions: number;
  passed: boolean;
  answers: any[]; // TODO: proper type
  correctAnswers?: number;
  timeTaken?: number;
}

const SecureExamApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [examActive, setExamActive] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(3600);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({});
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // API data states
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [examResults, setExamResults] = useState<ExamResult | null>(null);

  // Login form state
  const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' });
  const [registerData, setRegisterData] = useState<RegisterData>({ name: '', email: '', password: '', role: 'student' });
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState<boolean>(false);

  // Modal states
  const [showCreateExamModal, setShowCreateExamModal] = useState<boolean>(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [examFormData, setExamFormData] = useState<ExamFormData>({
    title: '',
    description: '',
    subject: '',
    duration: 60,
    difficulty: 'Medium',
    totalQuestions: 10,
    passingScore: 70,
    questions: []
  });
  const [studentFormData, setStudentFormData] = useState<StudentFormData>({
    name: '',
    email: '',
    password: ''
  });

  // Stable form handlers to prevent focus loss
  const handleLoginChange = useCallback((field, value) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleRegisterChange = useCallback((field, value) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleExamFormChange = useCallback((field, value) => {
    setExamFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleStudentFormChange = useCallback((field, value) => {
    setStudentFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Check for existing authentication on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUserProfile();
    }
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // API Functions
  const loadUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      setCurrentView(response.data.role === 'admin' ? 'dashboard' : 'student-dashboard');
    } catch (error) {
      localStorage.removeItem('token');
      setCurrentView('login');
    }
  };

  const loadExams = async () => {
    try {
      const response = await examsAPI.getExams();
      setExams(response.data);
    } catch (error) {
      console.error('Failed to load exams:', error);
    }
  };

  const loadStudents = async () => {
    if (user?.role === 'admin') {
      try {
        const response = await studentsAPI.getStudents();
        setStudents(response.data);
      } catch (error) {
        console.error('Failed to load students:', error);
      }
    }
  };

  const loadCertificates = async () => {
    try {
      const response = await certificatesAPI.getCertificates();
      setCertificates(response.data);
    } catch (error) {
      console.error('Failed to load certificates:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadAnalytics = async () => {
    if (user?.role === 'admin') {
      try {
        const response = await analyticsAPI.getOverview();
        setAnalytics(response.data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      }
    }
  };

  // Authentication handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(loginData);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setCurrentView(response.data.user.role === 'admin' ? 'dashboard' : 'student-dashboard');

      // Load initial data
      await Promise.all([
        loadExams(),
        loadNotifications(),
        loadCertificates(),
        loadAnalytics(),
        loadStudents()
      ]);

      addNotification('Login Successful', `Welcome back, ${response.data.user.name}!`, 'success');
    } catch (error) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.register(registerData);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setCurrentView(response.data.user.role === 'admin' ? 'dashboard' : 'student-dashboard');

      // Load initial data
      await Promise.all([
        loadExams(),
        loadNotifications(),
        loadCertificates(),
        loadAnalytics(),
        loadStudents()
      ]);

      addNotification('Registration Successful', 'Welcome to Quizzy!', 'success');
    } catch (error) {
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('login');
    setExams([]);
    setStudents([]);
    setCertificates([]);
    setNotifications([]);
    setAnalytics({});
    addNotification('Logged Out', 'You have been logged out successfully', 'info');
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setLoading(true);
      const response = await authAPI.uploadAvatar(formData);
      setUser(response.data.user);
      addNotification('Profile Updated', 'Profile picture uploaded successfully', 'success');
    } catch (error) {
      setError('Failed to upload profile picture');
      console.error('Avatar upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced tab switching detection with more security
  useEffect(() => {
    if (examActive) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setTabSwitchCount(prev => prev + 1);
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 3000);
          // Log security event
          addNotification('Security Alert', 'Tab switching detected during exam', 'warning');
        }
      };

      const handleKeyDown = (e) => {
        // Prevent common cheating shortcuts
        if ((e.ctrlKey || e.metaKey) && (e.key === 't' || e.key === 'n' || e.key === 'w')) {
          e.preventDefault();
          addNotification('Security Alert', 'Attempted to open new tab/window', 'danger');
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [examActive]);

  // Enhanced countdown timer with notifications
  useEffect(() => {
    if (examActive && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 600 && prev % 300 === 0 && prev > 0) {
            addNotification('Time Warning', `${prev / 60} minutes remaining!`, 'warning');
            if (Notification.permission === 'granted') {
              new Notification('Time Warning', { body: `${prev / 60} minutes remaining!` });
            }
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0) {
      handleSubmitExam();
    }
  }, [examActive, timeRemaining]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addNotification = (title, message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      title,
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10
  };

  const handleStartExam = async (exam: Exam) => {
    try {
      setLoading(true);
      const response = await examsAPI.startExam(exam._id || exam.id);
      setSelectedExam({ ...exam, ...response.data });
      setExamQuestions(response.data.questions || []);
      setExamActive(true);
      setTimeRemaining((exam.duration || 60) * 60);
      setCurrentView('exam');
      setTabSwitchCount(0);
      setAnswers({});

      if (Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      addNotification('Exam Started', `Good luck with ${exam.title}!`, 'info');
    } catch (error) {
      setError('Failed to start exam: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExam = async () => {
    try {
      setLoading(true);
      const response = await examsAPI.submitExam(selectedExam._id || selectedExam.id, answers);
      setExamActive(false);
      setExamResults(response.data);
      setCurrentView('results');

      // Reload certificates and analytics
      await Promise.all([loadCertificates(), loadAnalytics()]);

      addNotification('Exam Submitted', 'Your exam has been submitted successfully', 'success');
    } catch (error) {
      setError('Failed to submit exam: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await examsAPI.createExam(examFormData);
      setShowCreateExamModal(false);
      setExamFormData({
        title: '',
        description: '',
        subject: '',
        duration: 60,
        difficulty: 'Medium',
        totalQuestions: 10,
        passingScore: 70,
        questions: []
      });
      await loadExams();
      addNotification('Exam Created', 'New exam has been created successfully', 'success');
    } catch (error) {
      setError('Failed to create exam: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await studentsAPI.createStudent(studentFormData);
      setShowAddStudentModal(false);
      setStudentFormData({
        name: '',
        email: '',
        password: ''
      });
      await loadStudents();
      addNotification('Student Added', 'New student has been added successfully', 'success');
    } catch (error) {
      setError('Failed to add student: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async (student) => {
    try {
      setLoading(true);

      let studentId, examId, score;

      // Check if this is called from results page (student has examsTaken)
      if (student.examsTaken) {
        const passedExam = student.examsTaken.find(exam => exam.status === 'passed');
        if (!passedExam) {
          throw new Error('No passed exam found for this student');
        }
        studentId = student._id || student.id;
        examId = passedExam.exam;
        score = passedExam.score;
      } else {
        // Called from admin panel - need to find a completed exam for this student
        // For now, let's get all exams and find one this student completed
        const examsResponse = await examsAPI.getExams();
        const completedExam = examsResponse.data.find(exam =>
          exam.participants?.some(p =>
            p.user === student._id && p.status === 'completed' && p.score >= (exam.passingScore || 70)
          )
        );

        if (!completedExam) {
          throw new Error('No completed exams found for this student');
        }

        const participant = completedExam.participants.find(p => p.user === student._id);
        studentId = student._id;
        examId = completedExam._id;
        score = participant.score;
      }

      const response = await certificatesAPI.generateCertificate({
        studentId,
        examId,
        score
      });
      await loadCertificates();
      addNotification('Certificate Generated', 'Certificate has been generated successfully', 'success');
    } catch (error) {
      setError('Failed to generate certificate: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Admin Dashboard
  const AdminDashboard = () => (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Sidebar */}
      <div className={`bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-300 shadow-2xl ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-xl font-bold">{user?.role === 'admin' ? 'Admin Panel' : 'Student Panel'}</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hover:bg-gray-700 p-2 rounded-lg transition-colors" aria-label="Toggle sidebar">
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <nav className="mt-8">
          {user?.role === 'admin' ? (
            // Admin menu items
            [
              { icon: BarChart3, label: 'Dashboard', view: 'dashboard' },
              { icon: FileText, label: 'Exams', view: 'exams' },
              { icon: Users, label: 'Students', view: 'students' },
              { icon: Award, label: 'Certificates', view: 'certificates' },
              { icon: Download, label: 'Bulk Certificates', view: 'bulk-certificates' },
              { icon: Bell, label: 'Notifications', view: 'notifications' },
              { icon: Activity, label: 'Analytics', view: 'analytics' },
              { icon: Settings, label: 'Settings', view: 'settings' }
            ].map((item) => (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 transition-colors rounded-lg mx-2"
                aria-label={item.label}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))
          ) : (
            // Student menu items
            [
              { icon: BookOpen, label: 'My Dashboard', view: 'student-dashboard' },
              { icon: Award, label: 'My Certificates', view: 'certificates' },
              { icon: Settings, label: 'Settings', view: 'settings' }
            ].map((item) => (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 transition-colors rounded-lg mx-2"
                aria-label={item.label}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))
          )}
        </nav>
        <div className="absolute bottom-16 left-4 right-4">
          {sidebarOpen && user && (
            <div className="bg-gray-800 rounded-lg p-3 mb-2">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={user.avatar ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=40`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full"
                  />
                  <label
                    className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 cursor-pointer hover:bg-blue-700 transition-colors"
                    aria-label="Upload profile picture"
                    title="Upload profile picture"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      aria-label="Upload profile picture"
                    />
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {currentView === 'dashboard' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard Overview</h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-lg">
                    <Activity className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">System Active</span>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <Zap className="w-4 h-4 inline mr-2" />
                    Quick Actions
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Active Exams', value: '3', icon: FileText, color: 'blue', change: '+12%' },
                  { label: 'Total Students', value: '847', icon: Users, color: 'green', change: '+8%' },
                  { label: 'Certificates Issued', value: '1,234', icon: Award, color: 'purple', change: '+15%' },
                  { label: 'Avg Success Rate', value: '87%', icon: BarChart3, color: 'orange', change: '+3%' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-white/20 hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-500 rounded-xl flex items-center justify-center shadow-lg`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <span className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</span>
                        <div className="text-sm text-green-600 font-medium">{stat.change}</div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
                  <div className="space-y-4">
                    {[
                      { action: 'New exam created', detail: 'Physics Midterm', time: '2 hours ago', type: 'exam' },
                      { action: 'Certificate issued', detail: 'John Doe - Math Final', time: '5 hours ago', type: 'certificate' },
                      { action: 'Student registered', detail: 'Sarah Williams', time: '1 day ago', type: 'user' },
                      { action: 'Security alert', detail: 'Tab switching detected', time: '3 hours ago', type: 'security' }
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'exam' ? 'bg-blue-500' :
                            activity.type === 'certificate' ? 'bg-green-500' :
                            activity.type === 'user' ? 'bg-purple-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-800">{activity.action}</p>
                            <p className="text-sm text-gray-600">{activity.detail}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Security Overview</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Active Monitoring</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-600">Online</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Security Alerts (24h)</span>
                      <span className="text-sm font-medium text-red-600">3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">System Uptime</span>
                      <span className="text-sm font-medium text-green-600">99.9%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Encrypted Sessions</span>
                      <span className="text-sm font-medium text-blue-600">847</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'bulk-certificates' && (
            <BulkCertificateGenerator />
          )}

          {currentView === 'exams' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Exam Management</h1>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2" onClick={() => {
                  setExamFormData({
                    title: '',
                    description: '',
                    subject: '',
                    duration: 60,
                    difficulty: 'Medium',
                    totalQuestions: 10,
                    passingScore: 70,
                    questions: []
                  });
                  setShowCreateExamModal(true);
                }}>
                  <FileText className="w-5 h-5" />
                  <span>+ Create New Exam</span>
                </button>
              </div>
              <div className="grid gap-6">
                {exams.map(exam => (
                  <div key={exam._id || exam.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-white/20 hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{exam.title}</h3>
                          <p className="text-gray-600">Duration: {exam.duration} min | Questions: {exam.totalQuestions || exam.questions}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          exam.status === 'active' ? 'bg-green-100 text-green-700' :
                          exam.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {exam.status?.charAt(0).toUpperCase() + exam.status?.slice(1) || 'Active'}
                        </span>
                        <div className="mt-2 text-sm text-gray-500">
                          Difficulty: <span className={`font-medium ${
                            exam.difficulty === 'Easy' ? 'text-green-600' :
                            exam.difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                          }`}>{exam.difficulty}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <span className="text-gray-600">Participants: {exam.participants}</span>
                        <span className="text-gray-600">Pass Rate: {exam.passRate}%</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button className="text-blue-600 hover:underline text-sm">View Details</button>
                        <button className="text-green-600 hover:underline text-sm">Analytics</button>
                        <button className="text-red-600 hover:underline text-sm">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'students' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Student Management</h1>
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors" onClick={() => {
                  setStudentFormData({
                    name: '',
                    email: '',
                    password: ''
                  });
                  setShowAddStudentModal(true);
                }}>
                  <Users className="w-5 h-5 inline mr-2" />
                  Add Student
                </button>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Score</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Exams Taken</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.id} className="border-t hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{student.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{Math.round(student.examStats?.averageScore || 0)}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              {/* webhint-disable no-inline-styles */}
                              {/* webhint-disable no-inline-styles */}
                              {/* webhint-disable no-inline-styles */}
                              <div className="bg-blue-600 h-2 rounded-full" style={{width: `${Math.round(student.examStats?.averageScore || 0)}%`}}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            student.examStats?.totalCertificates > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {student.examStats?.totalCertificates > 0 ? 'Certified' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium">{student.examStats?.completedExams || 0}</span>
                          <span className="text-gray-500 text-sm ml-1">(Avg: {Math.round(student.examStats?.averageScore || 0)}%)</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => generateCertificate(student)}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Certificate
                            </button>
                            <button className="text-gray-600 hover:underline text-sm">Details</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentView === 'certificates' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-8">Certificate Management</h1>
              <div className="grid gap-6">
                {certificates.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/20">
                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-600 mb-2">No Certificates Yet</h3>
                    <p className="text-gray-500">Certificates will appear here once students pass exams</p>
                  </div>
                ) : (
                  certificates.map(cert => (
                    <div key={cert.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Award className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">{cert.examTitle}</h3>
                            <p className="text-gray-600">Issued to: {cert.studentName}</p>
                            <p className="text-sm text-gray-500">Certificate ID: {cert.certificateId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{cert.score}%</div>
                          <div className="text-sm text-gray-500">{cert.date}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center space-x-4">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2">
                          <Download className="w-4 h-4" />
                          <span>Download PDF</span>
                        </button>
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>Email Certificate</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {currentView === 'notifications' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-8">Notification Center</h1>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-600 mb-2">No Notifications</h3>
                    <p className="text-gray-500">Notifications will appear here</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div key={notification.id} className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${
                      notification.type === 'warning' ? 'border-yellow-500' :
                      notification.type === 'danger' ? 'border-red-500' :
                      notification.type === 'success' ? 'border-green-500' : 'border-blue-500'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            notification.type === 'warning' ? 'bg-yellow-500' :
                            notification.type === 'danger' ? 'bg-red-500' :
                            notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                          }`}></div>
                          <div>
                            <h3 className="font-bold text-gray-800">{notification.title}</h3>
                            <p className="text-gray-600">{notification.message}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{notification.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {currentView === 'analytics' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-8">Analytics Dashboard</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Performance Overview</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Exams Taken</span>
                      <span className="font-bold text-2xl text-blue-600">{analytics.totalExams || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Average Score</span>
                      <span className="font-bold text-2xl text-green-600">{Math.round(analytics.averageScore || 0)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pass Rate</span>
                      <span className="font-bold text-2xl text-purple-600">87%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Security Incidents</span>
                      <span className="font-bold text-2xl text-red-600">3</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Question Analysis</h2>
                  <div className="space-y-4">
                    {examQuestions.length > 0 ? examQuestions.slice(0, 5).map((q, i) => (
                      <div key={q._id || i} className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Q{i+1}: {q.text.substring(0, 30)}...</span>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>{q.difficulty}</span>
                          <span className="text-sm font-medium text-blue-600">85%</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-gray-500 text-center py-4">No exam questions available</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Trend Analysis</h2>
                <div className="flex items-center justify-center h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-white/50">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-gray-600 font-medium">Advanced analytics chart</p>
                    <p className="text-sm text-gray-500 mt-1">Real-time performance insights</p>
                    <div className="mt-4 flex justify-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'settings' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">System Settings</h1>
              <div className="grid gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">General Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">System Name</label>
                      <input
                        type="text"
                        defaultValue="Quizzy"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Exam Duration (minutes)</label>
                      <input
                        type="number"
                        defaultValue="60"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Security Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Tab Switching Detection</label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Monitor and log attempts to switch tabs during exams</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Require Email Verification</label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Require email verification for new user registrations</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={false}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Exam Modal */}
      {showCreateExamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Create New Exam</h2>
              <button
                onClick={() => setShowCreateExamModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close create exam modal"
                title="Close create exam modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateExam} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title</label>
                  <input
                    type="text"
                    value={examFormData.title}
                    onChange={(e) => handleExamFormChange('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white/80"
                    placeholder="Enter exam title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={examFormData.subject}
                    onChange={(e) => handleExamFormChange('subject', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white/80"
                    placeholder="e.g., Mathematics, Physics, Chemistry"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={examFormData.description}
                    onChange={(e) => handleExamFormChange('description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white/80"
                    placeholder="Enter exam description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="exam-duration" className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                    <input
                      id="exam-duration"
                      type="number"
                      value={examFormData.duration}
                      onChange={(e) => handleExamFormChange('duration', parseInt(e.target.value) || 60)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white/80"
                      min="10"
                      max="300"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="exam-difficulty" className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                    <select
                      id="exam-difficulty"
                      value={examFormData.difficulty}
                      onChange={(e) => handleExamFormChange('difficulty', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white/80"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="exam-questions" className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
                    <input
                      id="exam-questions"
                      type="number"
                      value={examFormData.totalQuestions}
                      onChange={(e) => handleExamFormChange('totalQuestions', parseInt(e.target.value) || 10)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white/80"
                      min="5"
                      max="50"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="exam-passing-score" className="block text-sm font-medium text-gray-700 mb-2">Passing Score (%)</label>
                    <input
                      id="exam-passing-score"
                      type="number"
                      value={examFormData.passingScore}
                      onChange={(e) => handleExamFormChange('passingScore', parseInt(e.target.value) || 70)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white/80"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateExamModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? 'Creating...' : 'Create Exam'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Add New Student</h2>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close add student modal"
                title="Close add student modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddStudent} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={studentFormData.name}
                    onChange={(e) => handleStudentFormChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter student's full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={studentFormData.email}
                    onChange={(e) => handleStudentFormChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={studentFormData.password}
                    onChange={(e) => handleStudentFormChange('password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Student Dashboard
  const StudentDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-800">Quizzy</h1>
              <div className="hidden md:flex items-center space-x-6">
                <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors">Dashboard</button>
                <button className="text-gray-600 hover:text-gray-700 font-medium transition-colors">My Exams</button>
                <button className="text-gray-600 hover:text-gray-700 font-medium transition-colors">Certificates</button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle dark mode"
                title="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
              <button className="relative" aria-label="Notifications" title="Notifications">
                <Bell className="w-6 h-6 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Available Exams</h2>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium text-blue-700">Welcome back!</span>
            </div>
            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
              <BarChart3 className="w-4 h-4 inline mr-2" />
              My Progress
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.filter(e => e.status === 'active').map(exam => (
            <div key={exam._id || exam.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-white/20 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <span className="bg-gradient-to-r from-green-400 to-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                    Active
                  </span>
                  <div className="mt-1 text-xs text-gray-500">
                    Pass Rate: {exam.passRate || 85}%
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{exam.title}</h3>
              <div className="space-y-2 mb-6">
                <p className="text-gray-600 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {exam.duration} minutes
                </p>
                <p className="text-gray-600 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  {exam.totalQuestions || exam.questions} questions
                </p>
                <p className="text-gray-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Difficulty: <span className={`font-medium ${
                    exam.difficulty === 'Easy' ? 'text-green-600' :
                    exam.difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{exam.difficulty || 'Medium'}</span>
                </p>
              </div>
              <button
                onClick={() => handleStartExam(exam)}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Start Exam'}
              </button>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h3>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-medium text-gray-800">Mathematics Final - Completed</p>
                  <p className="text-sm text-gray-600">Score: 85% | 2 days ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Award className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="font-medium text-gray-800">Certificate Earned</p>
                  <p className="text-sm text-gray-600">Mathematics Final | Issued 2 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Exam View
  const ExamView = () => (
    <div className="min-h-screen bg-gray-900 text-white">
      {showWarning && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center space-x-3 animate-pulse">
          <AlertTriangle className="w-6 h-6" />
          <span className="font-semibold">Warning: Tab switching detected! ({tabSwitchCount})</span>
        </div>
      )}

      <div className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{selectedExam?.title}</h1>
            <p className="text-gray-400 text-sm">Question {currentQuestion + 1} of {examQuestions.length}</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-sm">Secure Mode Active</span>
            </div>
            <div className="flex items-center space-x-2 bg-blue-600 px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5" />
              <span className="text-xl font-mono font-bold">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gray-800 rounded-xl p-8 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              examQuestions[currentQuestion]?.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
              examQuestions[currentQuestion]?.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
            }`}>
              {examQuestions[currentQuestion]?.difficulty || 'Medium'}
            </span>
            <span className="text-gray-400 text-sm">Question {currentQuestion + 1}</span>
          </div>
          <h2 className="text-2xl font-bold mb-6">{examQuestions[currentQuestion]?.text || 'Loading question...'}</h2>
          <div className="space-y-4">
            {examQuestions[currentQuestion]?.options?.map((option, i) => (
              <button
                key={i}
                onClick={() => setAnswers({...answers, [currentQuestion]: i})}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  answers[currentQuestion] === i
                    ? 'border-blue-500 bg-blue-900'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <span className="font-semibold mr-3">{String.fromCharCode(65 + i)}.</span>
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          {currentQuestion < examQuestions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmitExam}
              className="px-8 py-3 bg-green-600 rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              Submit Exam
            </button>
          )}
        </div>

        <div className="mt-8 bg-yellow-900 border-2 border-yellow-600 rounded-lg p-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <p className="font-semibold text-yellow-200">Security Notice</p>
            <p className="text-yellow-100 text-sm mt-1">
              This exam is being monitored. Tab switches: {tabSwitchCount}. 
              Excessive switching may result in automatic submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Results View
  const ResultsView = () => {
    const score = examResults?.score || Math.floor(Math.random() * 40) + 60;
    const passed = score >= 70;
    const totalQuestions = examQuestions.length;
    const correctAnswers = Math.floor(totalQuestions * score / 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
          <div className="text-center">
            {passed ? (
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            ) : (
              <X className="w-20 h-20 text-red-500 mx-auto mb-4" />
            )}
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {passed ? 'Congratulations!' : 'Keep Trying!'}
            </h1>
            <p className="text-gray-600 mb-8">Exam Completed Successfully</p>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="text-6xl font-bold text-blue-600 mb-2">{score}%</div>
              <p className="text-gray-600">Your Score</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{examQuestions.length}</p>
                <p className="text-sm text-gray-600">Total Questions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{Math.floor(examQuestions.length * score / 100)}</p>
                <p className="text-sm text-gray-600">Correct Answers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{tabSwitchCount}</p>
                <p className="text-sm text-gray-600">Tab Switches</p>
              </div>
            </div>

            {passed && (
              <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6">
                <Award className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Certificate Available!</h3>
                <p className="text-gray-600 mb-4">You've earned a certificate for passing this exam</p>
                <button
                  onClick={() => generateCertificate({
                    _id: user._id,
                    id: user.id,
                    examsTaken: [{
                      exam: selectedExam._id || selectedExam.id,
                      status: 'passed',
                      score: examResults?.score || score
                    }]
                  })}
                  disabled={loading}
                  className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors inline-flex items-center space-x-2 disabled:opacity-50"
                >
                  <Download className="w-5 h-5" />
                  <span>{loading ? 'Generating...' : 'Download Certificate'}</span>
                </button>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentView('student-dashboard')}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
              <button className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors inline-flex items-center justify-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>View Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render current view
  return (
    <>
      {currentView === 'login' && (
        <LoginView
          error={error}
          isLoginMode={isLoginMode}
          setIsLoginMode={setIsLoginMode}
          loginData={loginData}
          handleLoginChange={handleLoginChange}
          registerData={registerData}
          handleRegisterChange={handleRegisterChange}
          showLoginPassword={showLoginPassword}
          setShowLoginPassword={setShowLoginPassword}
          showRegisterPassword={showRegisterPassword}
          setShowRegisterPassword={setShowRegisterPassword}
          handleLogin={handleLogin}
          handleRegister={handleRegister}
          loading={loading}
        />
      )}
      {user?.role === 'admin' && ['dashboard', 'exams', 'students', 'certificates', 'bulk-certificates', 'notifications', 'analytics', 'settings'].includes(currentView) && <AdminDashboard />}
      {user?.role === 'student' && ['student-dashboard', 'certificates', 'settings'].includes(currentView) && (
        currentView === 'student-dashboard' ? (
          // @ts-ignore
          <StudentDashboard
            user={user}
            setCurrentView={setCurrentView}
            setSelectedExam={setSelectedExam}
            setExamQuestions={setExamQuestions}
            setExamResults={setExamResults}
            handleAvatarUpload={handleAvatarUpload}
            setUser={setUser}
            addNotification={addNotification}
            setGlobalLoading={setLoading}
            setGlobalError={setError}
          />
        ) : currentView === 'certificates' ? (
          // Student certificates view - show only their certificates
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">My Certificates</h1>
              <div className="grid gap-6">
                {certificates.filter(cert => cert.studentId === user._id).map(certificate => (
                  <div key={certificate._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{certificate.examTitle}</h3>
                        <p className="text-gray-600 dark:text-gray-400">Issued on {new Date(certificate.issuedAt).toLocaleDateString()}</p>
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <Download className="w-4 h-4 inline mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
                {certificates.filter(cert => cert.studentId === user._id).length === 0 && (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No certificates yet</h3>
                    <p className="text-gray-500 dark:text-gray-500">Complete exams to earn certificates</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Student settings view
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Settings</h1>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Profile Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                    <p className="text-gray-900 dark:text-gray-100">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <p className="text-gray-900 dark:text-gray-100">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}
      {currentView === 'exam' && (
        // @ts-ignore
        <ExamView
          selectedExam={selectedExam}
          examQuestions={examQuestions}
          currentQuestion={currentQuestion}
          setCurrentQuestion={setCurrentQuestion}
          answers={answers}
          setAnswers={setAnswers}
          timeRemaining={timeRemaining}
          setTimeRemaining={setTimeRemaining}
          handleSubmitExam={handleSubmitExam}
          tabSwitchCount={tabSwitchCount}
          showWarning={showWarning}
          setShowWarning={setShowWarning}
        />
      )}
      {currentView === 'results' && (
        // @ts-ignore
        <ResultsView
          selectedExam={selectedExam}
          examResults={examResults}
          setCurrentView={setCurrentView}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-lg font-medium text-gray-700">Loading...</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6" />
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-4 text-red-200 hover:text-white"
            aria-label="Close error message"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
};

export default SecureExamApp;