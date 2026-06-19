import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Response interceptor: normalize Axios errors ───────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Re-throw with a cleaner message for unexpected network errors
    if (!error.response) {
      error.message =
        'Unable to connect to the server. Please ensure the backend is running on port 5001.';
    }
    return Promise.reject(error);
  }
);

// ── Student Service ────────────────────────────────────────────────────────
export const studentService = {
  getStudents: async (page = 1, limit = 10) => {
    const response = await apiClient.get('/students', { params: { page, limit } });
    return response.data;
  },

  getStudentById: async (id) => {
    const response = await apiClient.get(`/students/${id}`);
    return response.data;
  },

  createStudent: async (studentData) => {
    const response = await apiClient.post('/students', studentData);
    return response.data;
  },

  updateStudent: async (id, studentData) => {
    const response = await apiClient.put(`/students/${id}`, studentData);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await apiClient.delete(`/students/${id}`);
    return response.data;
  },
};

// ── Mark Service ───────────────────────────────────────────────────────────
export const markService = {
  addMark: async (studentId, markData) => {
    const response = await apiClient.post(`/students/${studentId}/marks`, markData);
    return response.data;
  },

  getMarksByStudent: async (studentId) => {
    const response = await apiClient.get(`/students/${studentId}/marks`);
    return response.data;
  },

  updateMark: async (markId, markData) => {
    const response = await apiClient.put(`/marks/${markId}`, markData);
    return response.data;
  },

  deleteMark: async (markId) => {
    const response = await apiClient.delete(`/marks/${markId}`);
    return response.data;
  },
};

export default apiClient;
