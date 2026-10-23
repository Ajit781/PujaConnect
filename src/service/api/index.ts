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

// These endpoints do NOT need a Bearer token (pre-login)
const NO_AUTH_ENDPOINTS = [
  '/auth/generate_otp_v1',
  '/auth/validate_otp_v1',
  '/auth/generate_token_v1',
];

// ── Request Interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use(
  async config => {
    const url = config.url || '';
    const isAuthEndpoint = NO_AUTH_ENDPOINTS.some(e => url.includes(e));

    if (isAuthEndpoint) {
      console.log(`[API] 🔓 ${config.method?.toUpperCase()} ${url} | No token needed (auth endpoint)`);
      return config;
    }

    try {
      const token = await getSystemToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[API] ✅ ${config.method?.toUpperCase()} ${url} | Bearer token attached`);
      } else {
        console.warn(`[API] ⚠️ ${config.method?.toUpperCase()} ${url} | No token available`);
      }
    } catch (e) {
      console.warn(`[API] ❌ Could not attach token for ${url}:`, e);
    }
    return config;
  },
  error => Promise.reject(error),
);

// ── Response Interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  response => {
    const body = response.data;
    const url = response.config.url;

    if (body && typeof body.status === 'number') {
      if (body.status !== 0) {
        console.warn(`[API] ⚠️ Response Error | ${url} | status=${body.status} | ${body.message}`);
      } else {
        console.log(`[API] ✅ Response OK | ${url} | data=${body.data ? 'received' : 'null/empty'}`);
      }
      handleApiBusinessError(body, url);
    }

    return response;
  },
  async error => {
    const status = error?.response?.status;
    const url = error?.config?.url;
    const message = error?.response?.data?.message || error?.message;

    console.error(`[API] ❌ HTTP Error | ${url} | status=${status || 'NO_RESPONSE'} | ${message}`);

    if (status === 401) {
      console.warn('[API] 401 — clearing token, user needs to re-login');
      await clearSystemToken();
    }

    handleApiHttpError(status, url);
    return Promise.reject(error);
  },
);

export default api;
