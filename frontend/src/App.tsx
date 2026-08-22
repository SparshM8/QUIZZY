import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import LandingPage from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import TestsListPage from "./pages/TestsListPage";
import CreateTestPage from "./pages/CreateTestPage";
import TakeTestPage from "./pages/TakeTestPage";
import ResultPage from "./pages/ResultPage";
import QuestionsPage from "./pages/QuestionsPage";
import NotificationsPage from "./pages/NotificationsPage";
import CodeQuestionPage from "./pages/CodeQuestionPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import AssignmentDetailPage from "./pages/AssignmentDetailPage";

import AnalyticsPage from "./pages/AnalyticsPage";
import LiveCommandCenter from "./pages/LiveCommandCenter";
import SkillGapAnalytics from "./pages/SkillGapAnalytics";
import MockInterviewPage from "./pages/MockInterviewPage";
import CohortAnalyticsPage from "./pages/CohortAnalyticsPage";
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
        path="/"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />
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
            <Layout>
              <TestsListPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/create"
        element={
          <ProtectedRoute>
            <Layout>
              <CreateTestPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/:testId"
        element={
          <ProtectedRoute>
            <Layout>
              <TakeTestPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/:testId/attempts/:attemptId/result"
        element={
          <ProtectedRoute>
            <Layout>
              <ResultPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/questions"
        element={
          <ProtectedRoute>
            <Layout>
              <QuestionsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <NotificationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments"
        element={
          <ProtectedRoute>
            <Layout>
              <AssignmentsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assignments/:assignmentId"
        element={
          <ProtectedRoute>
            <Layout>
              <AssignmentDetailPage />
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
        path="/live"
        element={
          <ProtectedRoute>
            <Layout>
              <LiveCommandCenter />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/readiness"
        element={
          <ProtectedRoute>
            <Layout>
              <SkillGapAnalytics />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview"
        element={
          <ProtectedRoute>
            <Layout>
              <MockInterviewPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cohorts"
        element={
          <ProtectedRoute>
            <Layout>
              <CohortAnalyticsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/code/:questionId"
        element={
          <ProtectedRoute>
            <Layout>
              <CodeQuestionPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
