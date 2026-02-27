// API Service for SecureExam Platform
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('token');

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  getProfile: () => apiRequest('/auth/me'),

  updateDetails: (userData) => apiRequest('/auth/updatedetails', {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),

  updatePassword: (passwordData) => apiRequest('/auth/updatepassword', {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  }),

  uploadAvatar: (formData) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/auth/upload-avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }).then(response => {
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      return response.json();
    });
  },

  // Role management endpoints (super admin only)
  getAdmins: () => apiRequest('/auth/admins'),

  updateUserRole: (userId, role) => apiRequest(`/auth/admins/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  }),
};

// Exams API
export const examsAPI = {
  getExams: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/exams?${queryString}`);
  },

  getExam: (id) => apiRequest(`/exams/${id}`),

  getExamByJoinCode: (code) => apiRequest(`/exams/join/${code}`),

  createExam: (examData) => apiRequest('/exams', {
    method: 'POST',
    body: JSON.stringify(examData),
  }),

  updateExam: (id, examData) => apiRequest(`/exams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(examData),
  }),

  deleteExam: (id) => apiRequest(`/exams/${id}`, {
    method: 'DELETE',
  }),

  getInviteLink: (id) => apiRequest(`/exams/${id}/invite-link`),

  regenerateInviteLink: (id) => apiRequest(`/exams/${id}/invite-link/regenerate`, {
    method: 'POST'
  }),

  startExam: (id) => apiRequest(`/exams/${id}/start`, {
    method: 'POST',
  }),

  submitExam: (id, answers) => apiRequest(`/exams/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  }),
};

// Students API
export const studentsAPI = {
  getStudents: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/students?${queryString}`);
  },

  getStudent: (id) => apiRequest(`/students/${id}`),

  createStudent: (studentData) => apiRequest('/students', {
    method: 'POST',
    body: JSON.stringify(studentData),
  }),

  updateStudent: (id, studentData) => apiRequest(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(studentData),
  }),

  deleteStudent: (id) => apiRequest(`/students/${id}`, {
    method: 'DELETE',
  }),

  getStudentExams: (id) => apiRequest(`/students/${id}/exams`),
};

// Certificates API
export const certificatesAPI = {
  getCertificates: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/certificates?${queryString}`);
  },

  getCertificate: (id) => apiRequest(`/certificates/${id}`),

  generateCertificate: (data) => apiRequest('/certificates/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  generateBulkCertificates: (data) => apiRequest('/certificates/generate-bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  downloadCertificate: (id) => apiRequest(`/certificates/download/${id}`),

  verifyCertificate: (code) => apiRequest(`/certificates/verify/${code}`),
};

// Analytics API
export const analyticsAPI = {
  getOverview: () => apiRequest('/analytics/overview'),

  getExamAnalytics: () => apiRequest('/analytics/exams'),

  getUserAnalytics: () => apiRequest('/analytics/users'),

  getCertificateAnalytics: () => apiRequest('/analytics/certificates'),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/notifications?${queryString}`);
  },

  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, {
    method: 'PUT',
  }),

  markMultipleAsRead: (notificationIds) => apiRequest('/notifications/mark-read', {
    method: 'PUT',
    body: JSON.stringify({ notificationIds }),
  }),

  deleteNotification: (id) => apiRequest(`/notifications/${id}`, {
    method: 'DELETE',
  }),

  getStats: () => apiRequest('/notifications/stats/summary'),

  createNotification: (notificationData) => apiRequest('/notifications', {
    method: 'POST',
    body: JSON.stringify(notificationData),
  }),

  sendBulkNotifications: (notificationData) => apiRequest('/notifications/bulk', {
    method: 'POST',
    body: JSON.stringify(notificationData),
  }),

  broadcastNotification: (notificationData) => apiRequest('/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(notificationData),
  }),
};

export default {
  authAPI,
  examsAPI,
  studentsAPI,
  certificatesAPI,
  analyticsAPI,
  notificationsAPI,
};