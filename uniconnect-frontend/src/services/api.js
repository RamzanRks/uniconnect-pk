import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  verifyEmail: (email, code) => api.post('/auth/verify-email', { email, code }),
  resendCode: (email) => api.post('/auth/resend-code', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
    checkCode: (email, code) => api.post('/auth/check-code', { email, code }),
  changePassword: (data) => api.put('/auth/change-password', data),
    completeProfile: (data) => api.post('/auth/complete-profile', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  requestVerification: (formData) => api.post('/auth/verify', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  requestNameChange: (data) => api.post('/auth/name-change', data),
  setAvatar: (formData) => api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  removeAvatar: () => api.delete('/auth/avatar'),
  exportData: () => api.get('/auth/export'),
};

export const projectAPI = {
  getProjects: (params) => api.get('/projects', { params }),
  createProject: (projectData) => api.post('/projects', projectData),
  reportProject: (id, reportData) => api.post(`/projects/${id}/report`, reportData),
  getFilterOptions: () => api.get('/projects/filters'),
  getProject: (id) => api.get(`/projects/${id}`),
  updateProgress: (id, progress) => api.put(`/projects/${id}/progress`, { progress }),
  togglePin: (id) => api.post(`/projects/${id}/pin`),
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
  getMine: () => api.get('/applications/mine'),
};

export const adminAPI = {
  getPendingReports: () => api.get('/admin/reports'),
  deletePost: (id) => api.delete(`/admin/projects/${id}`),
  banUser: (id) => api.put(`/admin/users/${id}/ban`),
  addStrike: (id) => api.put(`/admin/users/${id}/strike`),
  removeStrike: (id) => api.put(`/admin/users/${id}/unstrike`),
  unbanUser: (id) => api.put(`/admin/users/${id}/unban`),
  warnUser: (id, message) => api.post(`/admin/users/${id}/warn`, { message }),
  getPendingVerifications: () => api.get('/admin/verifications'),
  approveVerification: (id) => api.put(`/admin/verifications/${id}/approve`),
  rejectVerification: (id) => api.put(`/admin/verifications/${id}/reject`),
  getStats: () => api.get('/admin/stats'),
  getList: (type) => api.get(`/admin/list/${type}`),
  getNameChanges: () => api.get('/admin/name-changes'),
  approveNameChange: (id) => api.put(`/admin/name-changes/${id}/approve`),
  rejectNameChange: (id) => api.put(`/admin/name-changes/${id}/reject`),
};

export const userAPI = {
  checkUsername: (username) => api.get(`/users/username/${username}/available`),
  getProfile: (id) => api.get(`/users/${id}`),
  follow: (id) => api.post(`/users/${id}/follow`),
  unfollow: (id) => api.post(`/users/${id}/unfollow`),
  removeFollower: (id) => api.post(`/users/${id}/remove-follower`),
  getFollowers: (id) => api.get(`/users/${id}/followers`),
  getFollowing: (id) => api.get(`/users/${id}/following`),
  report: (id, data) => api.post(`/users/${id}/report`, data),
  getActivity: (id) => api.get(`/users/${id}/activity`),
  myViews: () => api.get('/users/me/views'),
  explore: () => api.get('/users/explore'),
    block: (id) => api.post(`/users/${id}/block`),
  unblock: (id) => api.post(`/users/${id}/unblock`),
};

export const profileAPI = {
  update: (data) => api.put('/auth/profile', data),
  requestNameChange: (data) => api.post('/auth/name-change', data),
  setAvatar: (formData) => api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  removeAvatar: () => api.delete('/auth/avatar'),
};

export const bookmarkAPI = { toggle: (type, id) => api.post(`/bookmarks/${type}/${id}`), get: () => api.get('/bookmarks') };
export const ratingAPI = { create: (data) => api.post('/ratings', data), getUser: (id) => api.get(`/ratings/user/${id}`) };
export const reactionAPI = { toggle: (type, id, emoji) => api.post(`/reactions/${type}/${id}`, { emoji }), get: (type, id) => api.get(`/reactions/${type}/${id}`) };
export const topicAPI = { popular: () => api.get('/users/topics/popular'), toggle: (tag) => api.post(`/users/topics/${encodeURIComponent(tag)}/toggle`) };
export const presenceAPI = { get: (ids) => api.get(`/users/presence?ids=${ids.join(',')}`) };

// MILESTONE 5 ADDITIONS
export const messagesAPI = {
  open: (data) => api.post('/messages/open', data),
  getConversations: (params) => api.get('/messages/conversations', { params }),
  acceptRequest: (id) => api.put(`/messages/conversation/${id}/accept`),
  getMessages: (id) => api.get(`/messages/conversation/${id}`),
  getMeta: (id) => api.get(`/messages/conversation/${id}/meta`),
  send: (id, formData) => api.post(`/messages/conversation/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteMessage: (id) => api.post(`/messages/message/${id}/delete`),
  forward: (messageId, conversationId) => api.post('/messages/forward', { messageId, conversationId }),
  settings: (id, action) => api.post(`/messages/conversation/${id}/settings`, { action }),
  leave: (id) => api.post(`/messages/conversation/${id}/leave`),
  groupInfo: (id, formData) => api.post(`/messages/conversation/${id}/group-info`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  createGroup: (data) => api.post('/messages/group', data),
  addMembers: (id, memberIds) => api.post(`/messages/conversation/${id}/add-members`, { memberIds }),
  removeMember: (id, userId) => api.post(`/messages/conversation/${id}/remove-member`, { userId }),
  makeAdmin: (id, userId) => api.post(`/messages/conversation/${id}/make-admin`, { userId }),
};

export const searchAPI = { global: (q) => api.get(`/search?q=${encodeURIComponent(q)}`) };
export const leaderboardAPI = { getTop: () => api.get('/leaderboard'), getMyRank: () => api.get('/leaderboard/me') };
export const hubAPI = { get: (university) => api.get(`/hubs/${encodeURIComponent(university)}`) };
export const dashboardAPI = { get: () => api.get('/dashboard') };
export const announcementAPI = { get: () => api.get('/announcements'), create: (data) => api.post('/announcements', data), delete: (id) => api.delete(`/announcements/${id}`) };
export const endorsementAPI = { toggle: (data) => api.post('/endorsements', data), get: (userId) => api.get(`/endorsements/${userId}`) };

export default api;