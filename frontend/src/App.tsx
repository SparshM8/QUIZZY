import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import TestsListPage from "./pages/TestsListPage";
import TakeTestPage from "./pages/TakeTestPage";
import ResultPage from "./pages/ResultPage";
import QuestionsPage from "./pages/QuestionsPage";
import NotificationsPage from "./pages/NotificationsPage";
import CodeQuestionPage from "./pages/CodeQuestionPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import AssignmentDetailPage from "./pages/AssignmentDetailPage";
import RecruitmentPage from "./pages/RecruitmentPage";
import CandidateApplicationsPage from "./pages/CandidateApplicationsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { useAuth } from "./context/auth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests"
        element={
          <ProtectedRoute>
            <TestsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/:testId"
        element={
          <ProtectedRoute>
            <TakeTestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/:testId/attempts/:attemptId/result"
        element={
          <ProtectedRoute>
            <ResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/questions"
        element={
          <ProtectedRoute>
            <QuestionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments"
        element={
          <ProtectedRoute>
            <AssignmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments/:assignmentId"
        element={
          <ProtectedRoute>
            <AssignmentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruitment"
        element={
          <ProtectedRoute>
            <Layout>
              <RecruitmentPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <AnalyticsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <ProtectedRoute>
            <Layout>
              <CandidateApplicationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/code/:questionId"
        element={
          <ProtectedRoute>
            <CodeQuestionPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
