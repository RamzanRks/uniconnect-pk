import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  requestVerification: (formData) =>
    api.post('/auth/verify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};


export const projectAPI = {
  getProjects: (params) => api.get('/projects', { params }),
  createProject: (projectData) => api.post('/projects', projectData),
  reportProject: (id, reportData) => api.post(`/projects/${id}/report`, reportData),
  getFilterOptions: () => api.get('/projects/filters'),
};




export const qaAPI = {
  getQuestions: () => api.get('/qa'),
  createQuestion: (data) => api.post('/qa', data),
  getQuestionDetail: (id) => api.get(`/qa/${id}`),
  postAnswer: (id, data) => api.post(`/qa/${id}/answers`, data),
  reportQuestion: (id, reportData) => api.post(`/qa/${id}/report`, reportData),
  acceptAnswer: (id) => api.put(`/qa/answers/${id}/accept`),
};

export const applicationAPI = {
  apply: (projectId, data) => api.post(`/applications/project/${projectId}`, data),
  getForProject: (projectId) => api.get(`/applications/project/${projectId}`),
  updateStatus: (id, status) => api.put(`/applications/${id}/status`, { status }),
};

export const adminAPI = {
  getPendingReports: () => api.get('/admin/reports'),
  deletePost: (id) => api.delete(`/admin/projects/${id}`),
  banUser: (id) => api.put(`/admin/users/${id}/ban`),
  getPendingVerifications: () => api.get('/admin/verifications'),
  approveVerification: (id) => api.put(`/admin/verifications/${id}/approve`),
  rejectVerification: (id) => api.put(`/admin/verifications/${id}/reject`),
};

export default api;