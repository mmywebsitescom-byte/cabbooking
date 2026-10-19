import axios from 'axios';

const rawApiUrl = (import.meta as any).env?.VITE_API_URL;
const API_BASE = rawApiUrl
  ? `${rawApiUrl.replace(/\/+$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('driveease_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('driveease_token');
      localStorage.removeItem('driveease_user');
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.put('/auth/change-password', data),
};

// --- Cars ---
export const carsApi = {
  getAll: (params?: any) => api.get('/cars', { params }),
  getById: (id: string) => api.get(`/cars/${id}`),
  checkAvailability: (id: string, params: any) => api.get(`/cars/${id}/availability`, { params }),
  create: (data: any) => api.post('/cars', data),
  update: (id: string, data: any) => api.put(`/cars/${id}`, data),
  delete: (id: string) => api.delete(`/cars/${id}`),
  getAllAdmin: () => api.get('/cars/admin/all'),
  uploadImage: (formData: FormData) => api.post('/cars/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// --- Bookings ---
export const bookingsApi = {
  create: (data: any) => api.post('/bookings', data),
  getMyBookings: (params?: any) => api.get('/bookings/my', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  getByBookingId: (bookingId: string) => api.get(`/bookings/id/${bookingId}`),
  cancel: (id: string, data?: any) => api.post(`/bookings/${id}/cancel`, data),
  createPaymentOrder: (id: string) => api.post(`/bookings/${id}/payment/create-order`),
  verifyPayment: (id: string, data: any) => api.post(`/bookings/${id}/payment/verify`, data),
  verifyCode: (id: string, secretCode: string) => api.post(`/bookings/${id}/verify-code`, { secretCode }),
};

// --- Admin ---
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllBookings: (params?: any) => api.get('/admin/bookings', { params }),
  updateBookingStatus: (id: string, data: any) => api.put(`/admin/bookings/${id}/status`, data),
  approveBooking: (id: string) => api.post(`/admin/bookings/${id}/approve`),
  rejectBooking: (id: string, data?: any) => api.post(`/admin/bookings/${id}/reject`, data),
  refundBooking: (id: string, data?: any) => api.post(`/admin/bookings/${id}/refund`, data),
  confirmCash: (id: string) => api.post(`/bookings/${id}/cash-confirm`),
  getPayments: (params?: any) => api.get('/admin/payments', { params }),
  getAllUsers: () => api.get('/admin/users'),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  getUserBookings: (userId: string) => api.get(`/admin/users/${userId}/bookings`),
  getAuditLogs: () => api.get('/admin/audit-logs'),
  createAuditLog: (data: any) => api.post('/admin/audit-logs', data),
  getCoupons: () => api.get('/admin/coupons'),
  saveCoupons: (coupons: any[]) => api.post('/admin/coupons', { coupons }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings: any) => api.put('/admin/settings', { settings }),
  // CMS & Public Site Content
  getCms: () => api.get('/admin/cms'),
  updateCms: (cms: any) => api.put('/admin/cms', { cms }),
  // Customer Reviews
  getReviews: () => api.get('/admin/reviews'),
  createReview: (data: any) => api.post('/admin/reviews', data),
  updateReview: (id: string, data: any) => api.put(`/admin/reviews/${id}`, data),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`),
  // Database Backup
  getBackupStats: () => api.get('/admin/backup/stats'),
  exportBackup: () => api.get('/admin/backup/export'),
  // Locations Management
  getLocations: () => api.get('/admin/locations'),
  createLocation: (data: any) => api.post('/admin/locations', data),
  updateLocation: (id: string, data: any) => api.put(`/admin/locations/${id}`, data),
  deleteLocation: (id: string) => api.delete(`/admin/locations/${id}`),
};

// --- Locations ---
export const locationsApi = {
  getAll: () => api.get('/locations'),
  getAllAdmin: () => api.get('/admin/locations'),
  create: (data: any) => api.post('/admin/locations', data),
  update: (id: string, data: any) => api.put(`/admin/locations/${id}`, data),
  delete: (id: string) => api.delete(`/admin/locations/${id}`),
};

// --- Public ---
export const publicApi = {
  getSettings: () => api.get('/settings/public'),
  getCms: () => api.get('/settings/cms'),
  getReviews: () => api.get('/reviews/public'),
  getLocations: () => api.get('/locations'),
  healthCheck: () => api.get('/health'),
};

export default api;
