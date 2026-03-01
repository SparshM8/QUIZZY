import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle, CheckCircle, X } from 'lucide-react';

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
  type?: string;
}

interface ExamViewProps {
  selectedExam: Exam | null;
  examQuestions: ExamQuestion[];
  currentQuestion: number;
  setCurrentQuestion: (q: number) => void;
  answers: { [key: string]: any };
  setAnswers: React.Dispatch<React.SetStateAction<{ [key: string]: any }>>;
  timeRemaining: number;
  setTimeRemaining: (time: number) => void;
  handleSubmitExam: () => void;
  tabSwitchCount: number;
  showWarning: boolean;
  setShowWarning: (show: boolean) => void;
}

const ExamView: React.FC<ExamViewProps> = ({
  selectedExam,
  examQuestions,
  currentQuestion,
  setCurrentQuestion,
  answers,
  setAnswers,
  timeRemaining,
  setTimeRemaining,
  handleSubmitExam,
  tabSwitchCount,
  showWarning,
  setShowWarning
}) => {
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());

  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmitExam();
    }
  }, [timeRemaining, handleSubmitExam]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with input fields
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevQuestion();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextQuestion();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFlag(currentQuestion);
          break;
        case 'Enter':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleSubmitExam();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestion, examQuestions.length]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string | number, answer: any): void => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleFlag = (questionIndex: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  const nextQuestion = () => {
    if (currentQuestion < examQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const currentQ = examQuestions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flaggedQuestions.size;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{selectedExam?.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentQuestion + 1} of {examQuestions.length}
              <span className="sr-only">. Use arrow keys to navigate, F to flag, Ctrl+Enter to submit</span>
            </p>
          </div>
          <div className="flex items-center space-x-6">
            {/* Timer */}
            <div
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              }`}
              role="timer"
              aria-live="polite"
              aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
            >
              <Clock className="h-5 w-5" aria-hidden="true" />
              <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
            </div>

            {/* Progress */}
            <div className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
              Answered: {answeredCount}/{examQuestions.length}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 p-6" role="main">
          {currentQ && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4" id={`question-${currentQ._id || currentQ.id}`}>
                    {currentQ.question}
                  </h2>

                  {currentQ.type === 'multiple-choice' && (
                    <fieldset className="space-y-3">
                      <legend className="sr-only">Choose one answer for: {currentQ.question}</legend>
                      {currentQ.options?.map((option, index) => (
                        <label key={index} className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${currentQ._id || currentQ.id}`}
                            value={option}
                            checked={answers[currentQ._id || currentQ.id] === option}
                            onChange={(e) => handleAnswerChange(currentQ._id || currentQ.id, e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            aria-describedby={`question-${currentQ._id || currentQ.id}`}
                          />
                          <span className="text-gray-700 dark:text-gray-300">{option}</span>
                        </label>
                      ))}
                    </fieldset>
                  )}

                  {currentQ.type === 'true-false' && (
                    <fieldset className="space-y-3">
                      <legend className="sr-only">True or False: {currentQ.question}</legend>
                      {['True', 'False'].map((option) => (
                        <label key={option} className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${currentQ._id || currentQ.id}`}
                            value={option}
                            checked={answers[currentQ._id || currentQ.id] === option}
                            onChange={(e) => handleAnswerChange(currentQ._id || currentQ.id, e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            aria-describedby={`question-${currentQ._id || currentQ.id}`}
                          />
                          <span className="text-gray-700 dark:text-gray-300">{option}</span>
                        </label>
                      ))}
                    </fieldset>
                  )}

                  {currentQ.type === 'short-answer' && (
                    <div>
                      <label htmlFor={`answer-${currentQ._id || currentQ.id}`} className="sr-only">
                        Answer for: {currentQ.question}
                      </label>
                      <textarea
                        id={`answer-${currentQ._id || currentQ.id}`}
                        value={answers[currentQ._id || currentQ.id] || ''}
                        onChange={(e) => handleAnswerChange(currentQ._id || currentQ.id, e.target.value)}
                        placeholder="Enter your answer here..."
                        className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        rows={4}
                        aria-describedby={`question-${currentQ._id || currentQ.id}`}
                      />
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <nav className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-600" aria-label="Question navigation">
                  <button
                    onClick={prevQuestion}
                    disabled={currentQuestion === 0}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous question"
                    aria-disabled={currentQuestion === 0 ? "true" : "false"}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    <span>Previous</span>
                  </button>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleFlag(currentQuestion)}
                      className={`flex items-center space-x-2 px-4 py-2 border rounded-lg ${
                        flaggedQuestions.has(currentQuestion)
                          ? 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      aria-label={flaggedQuestions.has(currentQuestion) ? 'Unflag this question' : 'Flag this question for review'}
                      aria-pressed={flaggedQuestions.has(currentQuestion) ? "true" : "false"}
                    >
                      <Flag className="h-4 w-4" aria-hidden="true" />
                      <span>Flag</span>
                    </button>

                    <button
                      onClick={handleSubmitExam}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium focus:ring-2 focus:ring-red-500"
                      aria-label="Submit exam - this will end your test"
                    >
                      Submit Exam
                    </button>
                  </div>

                  <button
                    onClick={nextQuestion}
                    disabled={currentQuestion === examQuestions.length - 1}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next question"
                    aria-disabled={currentQuestion === examQuestions.length - 1 ? "true" : "false"}
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6" role="complementary">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Question Navigator</h3>

          <div className="grid grid-cols-5 gap-2 mb-6">
            {examQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`h-10 w-10 rounded-lg border-2 font-medium text-sm ${
                  index === currentQuestion
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : answers[examQuestions[index]._id || examQuestions[index].id]
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : flaggedQuestions.has(index)
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 bg-blue-50 rounded"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-green-500 bg-green-50 rounded"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-yellow-500 bg-yellow-50 rounded"></div>
              <span>Flagged</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Warning!</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Tab switching detected. This has been recorded. Please return to your exam.
            </p>
            <button
              onClick={() => setShowWarning(false)}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ExamView);