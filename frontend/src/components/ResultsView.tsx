import React from 'react';
import { CheckCircle, XCircle, Award, TrendingUp, Clock, Target, Home } from 'lucide-react';

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

interface ExamResult {
  score: number;
  totalQuestions: number;
  passed: boolean;
  answers: any[]; // TODO: proper type
  correctAnswers?: number;
  timeTaken?: number;
}

interface ResultsViewProps {
  selectedExam: Exam | null;
  examResults: ExamResult | null;
  setCurrentView: (view: string) => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({
  selectedExam,
  examResults,
  setCurrentView
}) => {
  if (!examResults) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const { score, totalQuestions, correctAnswers, timeTaken = 0, passed, answers } = examResults;
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {passed ? (
                <CheckCircle className="h-10 w-10 text-green-600" />
              ) : (
                <XCircle className="h-10 w-10 text-red-600" />
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {passed ? 'Congratulations!' : 'Exam Completed'}
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              {selectedExam?.title} - Results
            </p>

            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {passed ? 'Passed' : 'Failed'} - {percentage}% ({score}/{totalQuestions})
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Score</p>
                <p className="text-2xl font-bold text-gray-900">{score}/{totalQuestions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Percentage</p>
                <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Correct</p>
                <p className="text-2xl font-bold text-gray-900">{correctAnswers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Time Taken</p>
                <p className="text-2xl font-bold text-gray-900">{Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Section */}
        {passed && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Award className="h-8 w-8 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Certificate Earned!</h3>
                  <p className="text-gray-600">Congratulations on passing the exam. Your certificate is ready.</p>
                </div>
              </div>
              <button className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Download Certificate</span>
              </button>
            </div>
          </div>
        )}

        {/* Detailed Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Detailed Results</h3>

          <div className="space-y-4">
            {answers && Object.entries(answers).map(([questionIndex, answer]) => (
              <div key={questionIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Question {parseInt(questionIndex) + 1}
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">{answer.question}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Your Answer:</p>
                        <p className={`text-sm ${answer.correct ? 'text-green-600' : 'text-red-600'}`}>
                          {answer.userAnswer || 'Not answered'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Correct Answer:</p>
                        <p className="text-sm text-green-600">{answer.correctAnswer}</p>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    {answer.correct ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setCurrentView('student-dashboard')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
          >
            <Home className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ResultsView);