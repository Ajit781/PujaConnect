import { store } from '../store';
import { logout } from '../store/slices/authSlice';
import { clearSystemToken } from '../service/api/tokenService';

/**
 * Common logout function to be used anywhere in the app.
 * Guarantees that both AsyncStorage (token) and Redux (session)
 * are cleanly wiped out.
 */
export async function performLogout() {
  console.log('[Auth] Performing universal logout...');

  // 1. Clear cached token so interceptors stop using it immediately
  await clearSystemToken();

  // 2. Clear Redux state which will automatically switch Navigation back to Auth stack
  store.dispatch(logout());
}
