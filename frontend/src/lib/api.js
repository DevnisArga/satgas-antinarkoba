import axios from 'axios';

// Base URL fleksibel: membaca dari VITE_API_URL jika di-hosting terpisah (Vercel, Netlify, dsb.)
// atau fallback ke relative '/api' jika di-hosting satu domain / reverse proxy
const apiBaseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper untuk URL berkas/gambar uploads agar fleksibel di server lokal maupun hosting cloud
export const getUploadUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const hostBase = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
    : '';
  const cleanPath = filePath.replace(/^\/?uploads\//, '');
  return `${hostBase}/uploads/${cleanPath}`;
};

// Request interceptor for auth token & FormData handling
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
