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

type LogoutFn = () => void;

// Module-level references — initialized once from App.tsx after providers mount
let _showAlert: ShowAlertFn | null = null;
let _logout: LogoutFn | null = null;

/**
 * Call this once in App.tsx (inside AlertProvider + Redux Provider) to wire
 * the error handler to the global alert and logout functions.
 */
export function initApiErrorHandler(showAlert: ShowAlertFn, logout: LogoutFn) {
  _showAlert = showAlert;
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
export function handleApiBusinessError(data: {
  status: number;
  message: string;
}): boolean {
  if (data.status === 0) return true; // All good

  _showAlert?.({
    title: 'Notice',
    message: data.message || 'Something went wrong. Please try again.',
    buttons: [{ text: 'OK' }],
  });
  return false;
}

/**
 * Call from the Axios error interceptor for non-2xx responses.
 * Handles 401 (logout) and all other codes (generic message).
 */
export function handleApiHttpError(status: number | undefined, url?: string) {
  if (isAuthEndpoint(url)) return; // Auth screens handle their own errors

  if (status === 401) {
    _showAlert?.({
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again to continue.',
      buttons: [
        {
          text: 'OK',
          onPress: () => _logout?.(),
        },
      ],
    });
    return;
  }

  // All other error codes — show a clean, generic production message
  _showAlert?.({
    title: 'Something Went Wrong',
    message:
      'We were unable to complete your request. Please check your connection and try again.',
    buttons: [{ text: 'OK' }],
  });
}
