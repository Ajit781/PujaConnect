import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import { getSystemToken, clearSystemToken } from './tokenService';
import { handleApiBusinessError, handleApiHttpError } from './apiErrorHandler';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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

    if (body && typeof body.status === 'number') {
      handleApiBusinessError(body);
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
