import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../../config/apiConfig';

const TOKEN_KEY = 'system_access_token';
const TOKEN_EXPIRY_KEY = 'system_token_expires_at';
const CREDENTIALS_KEY = 'system_token_credentials';

/**
 * Fetches a fresh token using stored or provided credentials.
 *
 * Called in 2 scenarios:
 *  1. Explicitly AFTER OTP login (pass userName, passWord, userTypeId)
 *  2. Auto-refresh when token expires (called without args, uses stored creds)
 */
export async function fetchFreshToken(
  userName?: string,
  passWord?: string,
  userTypeId?: number,
  caller: string = 'UNKNOWN',
): Promise<string> {
  console.log(`[TokenService] 🔍 fetchFreshToken triggered | REASON: ${caller} | time=${new Date().toLocaleTimeString()}`);

  let uName = userName;
  let pWord = passWord;
  let uType = userTypeId;

  if (uName && pWord && uType) {
    // Scenario 1: After OTP login — save creds for future auto-refreshes
    await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ uName, pWord, uType }));
    console.log(`[TokenService] 🔑 Token fetch triggered AFTER OTP LOGIN | user=${uName} | type=${uType} | time=${new Date().toLocaleTimeString()}`);
  } else {
    // Scenario 2: Auto-refresh — load stored credentials
    const stored = await AsyncStorage.getItem(CREDENTIALS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        uName = parsed.uName;
        pWord = parsed.pWord;
        uType = parsed.uType;
        console.log(`[TokenService] 🔄 Token fetch triggered for AUTO-REFRESH | user=${uName} | type=${uType} | time=${new Date().toLocaleTimeString()}`);
      } catch (e) {
        console.warn('[TokenService] ❌ Failed to parse stored credentials:', e);
      }
    }
    if (!uName || !pWord || !uType) {
      throw new Error('[TokenService] No credentials available. User must login first.');
    }
  }

  const payload = {
    enc_data: JSON.stringify({
      user_name: uName,
      pass_word: pWord,
      user_type_id: uType,
    }),
  };

  console.log(`[TokenService] 📤 Calling Token API at ${new Date().toLocaleTimeString()}`);

  const response = await axios.post(
    `${API_BASE_URL}${ENDPOINTS.generateToken}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } },
  );

  console.log('[TokenService] 📥 Token API Response:', JSON.stringify(response.data, null, 2));

  if (!response.data?.data) {
    throw new Error(`[TokenService] Token API returned null data. Response: ${JSON.stringify(response.data)}`);
  }

  const { access_token, expires_at } = response.data.data;

  // 🕒 Timezone Fix: Server sends time in a different timezone.
  // Parsing it directly can cause token to appear expired immediately.
  // Token is valid for 5 mins, so we calculate local expiry.
  const localExpiryMs = Date.now() + 5 * 60 * 1000;
  
  await AsyncStorage.setItem(TOKEN_KEY, access_token);
  await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, localExpiryMs.toString());

  console.log(`[TokenService] ✅ Token STORED successfully | original_expires_at=${expires_at} | local_expires_at=${localExpiryMs}`);

  return access_token;
}

/**
 * Returns a valid Bearer token.
 * - Uses cached token if still valid (> 5 min remaining)
 * - Otherwise auto-refreshes using stored credentials
 * - Returns null only on network/server failure
 */
export async function getSystemToken(): Promise<string | null> {
  const cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  const expiresAt = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);

  if (cachedToken && expiresAt) {
    let expiryDate = new Date(Number(expiresAt));
    if (isNaN(expiryDate.getTime())) {
      // Fallback for old string format like "2026-10-07 14:30:00"
      let formatted = expiresAt.replace(' ', 'T');
      if (!formatted.endsWith('Z') && !formatted.includes('+')) {
        formatted += '+00:00';
      }
      expiryDate = new Date(formatted);
    }

    const now = new Date();
    const remainingMs = expiryDate.getTime() - now.getTime();
    const isValid = remainingMs > 60 * 1000; // Require at least 1 min remaining

    if (isValid) {
      console.log(`[TokenService] ✅ Cached token is valid | ${Math.floor(remainingMs / 60000)} min remaining`);
      return cachedToken;
    }
    console.log('[TokenService] ⏰ Cached token expired or expiring soon — auto-refreshing...');
  } else {
    console.log('[TokenService] ℹ️ No cached token in storage');
  }

  try {
    return await fetchFreshToken(undefined, undefined, undefined, 'TOKEN_EXPIRED_AUTO_REFRESH');
  } catch (err) {
    console.warn('[TokenService] ❌ Failed to fetch fresh token:', err);
    return null;
  }
}

/**
 * Clears the cached token.
 * Call on 401 errors or logout.
 */
export async function clearSystemToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(TOKEN_EXPIRY_KEY);
  console.log('[TokenService] 🗑️ Cached token cleared');
}

/**
 * Clears stored user credentials.
 * Call ONLY on explicit user logout.
 */
export async function clearSystemCredentials(): Promise<void> {
  await AsyncStorage.removeItem(CREDENTIALS_KEY);
  console.log('[TokenService] 🗑️ User credentials cleared');
}
