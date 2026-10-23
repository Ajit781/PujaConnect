import { AlertButton } from '../../components/common/CustomAlert';
import { ENDPOINTS } from '../../config/apiConfig';

// Endpoints that are used before a user is logged in.
// 401 logout-trigger and "data.status != 0" checks are skipped for these.
const AUTH_ONLY_ENDPOINTS = [
  ENDPOINTS.generateToken,
  ENDPOINTS.sendOtp,
  ENDPOINTS.verifyOtp,
];

type ShowAlertFn = (opts: {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}) => void;

type ShowErrorAlertFn = (message?: string) => void;

type LogoutFn = () => void;

// Module-level references — initialized once from App.tsx after providers mount
let _showAlert: ShowAlertFn | null = null;
let _showErrorAlert: ShowErrorAlertFn | null = null;
let _logout: LogoutFn | null = null;

/**
 * Call this once in App.tsx (inside AlertProvider + Redux Provider) to wire
 * the error handler to the global alert and logout functions.
 */
export function initApiErrorHandler(
  showAlert: ShowAlertFn,
  showErrorAlert: ShowErrorAlertFn,
  logout: LogoutFn,
) {
  _showAlert = showAlert;
  _showErrorAlert = showErrorAlert;
  _logout = logout;
}

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_ONLY_ENDPOINTS.some(ep => url.includes(ep));
}

/**
 * Call from the Axios response interceptor for 200 responses.
 * Checks `data.status` — if non-zero, shows the API's own message.
 * Returns true if the response is clean (status === 0).
 */
export function handleApiBusinessError(
  data: { status: number; message?: string },
  url?: string,
): boolean {
  if (data.status === 0) return true; // All good
  if (url && url.includes('/book_puja_v1') && data.status === 1) return true; // Booking successful uses 1
  if (data.message && data.message.toLowerCase().includes('order has been placed')) return true; // Catch any success messages that use non-zero status
  if (isAuthEndpoint(url)) return false; // Auth endpoints like Login handle their own specific messages

  if (data.message) {
    _showErrorAlert?.(data.message);
  }
  return false;
}

/**
 * Call from the Axios error interceptor for non-2xx responses.
 * Handles 401 (logout) and all other codes (generic message).
 */
export function handleApiHttpError(status: number | undefined, url?: string) {
  if (isAuthEndpoint(url)) return; // Auth screens handle their own errors

  // All other error codes — show a clean, generic production message
  if (!status || status === 0) {
    _showErrorAlert?.('Network. Please check your internet connection and try again.');
  } else if (status !== 401) {
    _showErrorAlert?.('We were unable to complete your request.');
  }
}
