import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '@/utils/storage';

const API_URL = 'http://192.168.0.101:5000/api/v1';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach access token to every request
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.get('gymos_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }
    originalRequest._retry = true;
    isRefreshing = true;
    try {
      const refreshToken = await storage.get('gymos_refresh_token');
      if (!refreshToken) throw new Error('No refresh token');
      const { data } = await axios.post(`${API_URL}/auth/token/refresh`, { refreshToken });
      const newAccess: string = data.data.accessToken;
      const newRefresh: string = data.data.refreshToken;
      await storage.set('gymos_access_token', newAccess);
      await storage.set('gymos_refresh_token', newRefresh);
      processQueue(null, newAccess);
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await storage.clearAll();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;