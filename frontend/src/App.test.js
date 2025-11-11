import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SecureExamApp from './App';

// Mock the API modules
jest.mock('./api', () => ({
  authAPI: {
    getProfile: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    uploadAvatar: jest.fn(),
  },
  examsAPI: {
    getExams: jest.fn(),
    startExam: jest.fn(),
    submitExam: jest.fn(),
    createExam: jest.fn(),
  },
  studentsAPI: {
    getStudents: jest.fn(),
    createStudent: jest.fn(),
  },
  certificatesAPI: {
    getCertificates: jest.fn(),
    generateCertificate: jest.fn(),
  },
  analyticsAPI: {
    getOverview: jest.fn(),
  },
  notificationsAPI: {
    getNotifications: jest.fn(),
  },
}));

// Mock the component imports
jest.mock('./components/LoginView', () => {
  return function MockLoginView(props) {
    return (
      <div data-testid="login-view">
        <h1>Login</h1>
        <button onClick={() => props.setIsLoginMode(!props.isLoginMode)}>
          Toggle Mode
        </button>
      </div>
    );
  };
});

jest.mock('./components/StudentDashboard', () => {
  return function MockStudentDashboard(props) {
    return <div data-testid="student-dashboard">Student Dashboard</div>;
  };
});

jest.mock('./components/ExamView', () => {
  return function MockExamView() {
    return <div data-testid="exam-view">Exam View</div>;
  };
});

jest.mock('./components/ResultsView', () => {
  return function MockResultsView() {
    return <div data-testid="results-view">Results View</div>;
  };
});

jest.mock('./components/BulkCertificateGenerator', () => {
  return function MockBulkCertificateGenerator() {
    return <div data-testid="bulk-certificate-generator">Bulk Certificate Generator</div>;
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock Notification API
global.Notification = {
  permission: 'default',
  requestPermission: jest.fn(),
};

// Mock document methods
Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false,
});

Object.defineProperty(document, 'visibilityState', {
  writable: true,
  value: 'visible',
});

describe('SecureExamApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('renders without crashing', () => {
    expect(() => render(<SecureExamApp />)).not.toThrow();
  });

  test('renders login view by default when no user is logged in', () => {
    render(<SecureExamApp />);

    expect(screen.getByTestId('login-view')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('handles login mode toggle button exists', () => {
    render(<SecureExamApp />);

    const toggleButton = screen.getByText('Toggle Mode');
    expect(toggleButton).toBeInTheDocument();
  });

  test('component structure is correct', () => {
    const { container } = render(<SecureExamApp />);

    // Check that the main app container is rendered
    expect(container.firstChild).toBeInTheDocument();
  });
});