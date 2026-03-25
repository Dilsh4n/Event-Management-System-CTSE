import axios from 'axios';

// In production (Docker/AWS), REACT_APP_API_BASE_URL points to the ALB or gateway.
// In dev, Vite proxy handles /api/* → individual services.
const BASE = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({ baseURL: BASE });

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (name, email, password) =>
  api.post('/users', { name, email, password });

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

// Users
export const getMe = () => api.get('/users/me');
export const getUserById = (id) => api.get(`/users/${id}`);
export const getAllUsers = () => api.get('/users');
export const getAdminUsers = () => api.get('/admin/users');

// Events
export const getEvents = () => api.get('/events');
export const getEventById = (id) => api.get(`/events/${id}`);
export const createEvent = (data) => api.post('/events', data);

// Registrations
export const registerForEvent = (userId, eventId) =>
  api.post('/registrations', { userId, eventId });
export const getMyRegistrations = (userId) =>
  api.get(`/registrations/user/${userId}`);
export const cancelRegistration = (id) =>
  api.delete(`/registrations/${id}`);

// Notifications
export const getMyNotifications = (userId) =>
  api.get(`/notifications/user/${userId}`);

export default api;
