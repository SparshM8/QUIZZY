import React, { useState, useEffect } from 'react';
import { Clock, Play, CheckCircle, AlertCircle, BookOpen, Award, TrendingUp } from 'lucide-react';
import { examsAPI } from '../api';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
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
  answers: { [key: number]: number };
}

interface StudentDashboardProps {
  user: User | null;
  setCurrentView: (view: string) => void;
  setSelectedExam: (exam: Exam | null) => void;
  setExamQuestions: (questions: ExamQuestion[]) => void;
  setExamResults: (results: ExamResult | null) => void;
  handleAvatarUpload: (file: File) => Promise<void>;
  setUser: (user: User | null) => void;
  addNotification: (message: string, type: string) => void;
  setGlobalLoading: (loading: boolean) => void;
  setGlobalError: (error: string) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  setCurrentView,
  setSelectedExam,
  setExamQuestions,
  setExamResults,
  handleAvatarUpload,
  setUser,
  addNotification,
  setGlobalLoading,
  setGlobalError
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await examsAPI.getExams();
      setExams(response.data);
    } catch (error) {
      console.error('Failed to load exams:', error);
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (exam: Exam) => {
    try {
      // Start exam and get questions
      const response = await examsAPI.startExam(exam._id);
      setSelectedExam(response.data);
      setExamQuestions(response.data.questions);
      setCurrentView('exam');
    } catch (error) {
      console.error('Failed to start exam:', error);
      setError('Failed to start exam');
    }
  };

  const handleViewResults = (exam: Exam) => {
    // This would need to be implemented to show past results
    setSelectedExam(exam);
    setCurrentView('results');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={user?.avatar ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${user.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff&size=80`}
              alt="Profile"
              className="w-20 h-20 rounded-full border-4 border-blue-100"
            />
            <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAvatarUpload(file); }}
                className="hidden"
              />
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </label>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-gray-600 mb-4">Ready to take your next exam?</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Email: {user?.email}</span>
              <span>•</span>
              <span>Role: Student</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <div key={exam._id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{exam.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{exam.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span>{exam.subject}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{exam.duration} min</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-sm">
                <span className="text-gray-500">Questions: </span>
                <span className="font-medium">{exam.totalQuestions}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Passing: </span>
                <span className="font-medium">{exam.passingScore}%</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleStartExam(exam)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Start Exam</span>
              </button>
              <button
                onClick={() => handleViewResults(exam)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Results</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {exams.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No exams available</h3>
          <p className="text-gray-600">Check back later for new exams.</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(StudentDashboard);