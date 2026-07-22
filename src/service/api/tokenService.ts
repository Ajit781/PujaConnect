import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  API_BASE_URL,
  SYSTEM_BASIC_AUTH,
  ENDPOINTS,
} from '../../config/apiConfig';

const TOKEN_KEY = 'system_access_token';
const TOKEN_EXPIRY_KEY = 'system_token_expires_at';

/**
 * Fetches a fresh system-level Bearer token from the API.
 * Uses Basic Auth credentials (admin-level) to get a token valid for 24 hours.
 */
export async function fetchFreshToken(): Promise<string> {
  const response = await axios.post(
    `${API_BASE_URL}${ENDPOINTS.generateToken}`,
    null,
    {
      headers: {
        Authorization: `Basic ${SYSTEM_BASIC_AUTH}`,
      },
    },
  );

  const { access_token, expires_at } = response.data.data;

  // Persist token and its expiry to AsyncStorage
  await AsyncStorage.setItem(TOKEN_KEY, access_token);
  await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expires_at);

  return access_token;
}

/**
 * Returns a valid system Bearer token.
 * - If a fresh cached token exists, returns it immediately.
 * - If missing or expired, auto-fetches a new one from the server.
 * - Returns null only if the fetch itself fails (network error, etc.).
 */
export async function getSystemToken(): Promise<string | null> {
  const cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  const expiresAt = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);

  if (cachedToken && expiresAt) {
    // expires_at format: "2026-03-19 02:09:48" — compare with current time
    const expiryDate = new Date(expiresAt.replace(' ', 'T') + '+00:00');
    const now = new Date();
    // Refresh 5 minutes before actual expiry to avoid edge cases
    const isValid = expiryDate.getTime() - now.getTime() > 5 * 60 * 1000;

    if (isValid) {
      return cachedToken;
    }
  }

  // Token missing or expired — auto-fetch a fresh one silently
  try {
    console.log('[TokenService] No valid token found — fetching fresh token...');
    const freshToken = await fetchFreshToken();
    console.log('[TokenService] Fresh token fetched successfully.');
    return freshToken;
  } catch (err) {
    console.warn('[TokenService] Failed to fetch fresh token:', err);
    return null;
  }
}

/**
 * Force-clears the cached token.
 * Call this on logout or when a 401 is encountered.
 */
export async function clearSystemToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(TOKEN_EXPIRY_KEY);
}
