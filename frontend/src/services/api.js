import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Officials API
export const officialsAPI = {
  getAll: (params) => axios.get(`${API_URL}/officials`, { params }),
  getById: (id) => axios.get(`${API_URL}/officials/${id}`),
  create: (data) => axios.post(`${API_URL}/officials`, data),
  updateRating: (id, type) => axios.put(`${API_URL}/officials/${id}/rating`, { type }),
};

// Promises API
export const promisesAPI = {
  getByOfficial: (officialId) => axios.get(`${API_URL}/promises/official/${officialId}`),
  getById: (id) => axios.get(`${API_URL}/promises/${id}`),
  create: (data) => axios.post(`${API_URL}/promises`, data),
  update: (id, data) => axios.put(`${API_URL}/promises/${id}`, data),
};

// Activity API
export const activityAPI = {
  getAll: () => axios.get(`${API_URL}/activity`),
  getByOfficial: (officialId) => axios.get(`${API_URL}/activity/official/${officialId}`),
  create: (data) => axios.post(`${API_URL}/activity`, data),
};

// Compare API
export const compareAPI = {
  getByOfficial: (officialId) => axios.get(`${API_URL}/compare/official/${officialId}`),
  create: (data) => axios.post(`${API_URL}/compare`, data),
};

// Forum API
export const forumAPI = {
  getByOfficial: (officialId) => axios.get(`${API_URL}/forum/official/${officialId}`),
  create: (data) => axios.post(`${API_URL}/forum`, data),
  likeComment: (id) => axios.put(`${API_URL}/forum/${id}/like`),
};
