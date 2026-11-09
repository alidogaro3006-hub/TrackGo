import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('trackgo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/users/login') || url.includes('/users/register');
    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const registerUser = (data) => api.post('/users/register', data);

export const loginUser = (data) => api.post('/users/login', data);

export const getProfile = () => api.get('/users/profile');

export const updateProfile = (data) => api.put('/users/profile', data);

export const searchSchedules = (params) => api.get('/bookings/search', { params });

export const createBooking = (data) => api.post('/bookings', data);

export const cancelBooking = (id) => api.put(`/bookings/${id}/cancel`);

export const getMyBookings = () => api.get('/bookings/my');

export const getScheduleById = (id) => api.get(`/bookings/schedule/${id}`);

export const getRecommendations = (params) => api.get('/recommendations', { params });

export const adminGetRoutes = () => api.get('/admin/routes');

export const adminCreateRoute = (data) => api.post('/admin/routes', data);

export const adminUpdateRoute = (id, data) => api.put(`/admin/routes/${id}`, data);

export const adminDeleteRoute = (id) => api.delete(`/admin/routes/${id}`);

export const adminGetVehicles = () => api.get('/admin/vehicles');

export const adminCreateVehicle = (data) => api.post('/admin/vehicles', data);

export const adminUpdateVehicle = (id, data) => api.put(`/admin/vehicles/${id}`, data);

export const adminDeleteVehicle = (id) => api.delete(`/admin/vehicles/${id}`);

export const adminGetSchedules = (params) => api.get('/admin/schedules', { params });

export const adminCreateSchedule = (data) => api.post('/admin/schedules', data);

export const adminUpdateSchedule = (id, data) => api.put(`/admin/schedules/${id}`, data);

export const adminDeleteSchedule = (id) => api.delete(`/admin/schedules/${id}`);

export const adminGetBookings = (params) => api.get('/admin/bookings', { params });

export default api;
