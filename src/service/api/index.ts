import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { getSystemToken, clearSystemToken } from './tokenService';
import { handleApiBusinessError, handleApiHttpError } from './apiErrorHandler';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use(
  async config => {
    try {
      const token = await getSystemToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('[API] Could not attach system token:', e);
    }
    return config;
  },
  error => Promise.reject(error),
);

// ── Response Interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  response => {
    // HTTP 200 — still validate the business-level status field
    const body = response.data;
    const url = response.config.url;

    if (body && typeof body.status === 'number') {
      if (body.status !== 0) {
        console.warn(`[API Response Error] URL: ${url}, Status: ${body.status}, Message: ${body.message}`);
      }
      handleApiBusinessError(body, url);
    }

    return response;
  },
  async error => {
    const status = error?.response?.status;
    const url = error?.config?.url;

    if (status === 401) {
      await clearSystemToken();
    }

    handleApiHttpError(status, url);

    return Promise.reject(error);
  },
);

export default api;
