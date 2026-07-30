import api from '../api';
import { ENDPOINTS } from '../../config/apiConfig';
import { fetchFreshToken } from '../api/tokenService';

export interface GenerateOtpResponse {
  user_name: string;
  user_otp: string; // provided by server (dev only)
}

export interface ValidateOtpResponse {
  user_id: number;
  user_name: string;
  mobile?: string;
  mobile_no?: string;
  contact_no?: string;
}

/**
 * Sends OTP to the given mobile number.
 * The API expects enc_data as a JSON string.
 */
export async function generateOtp(
  mobileNumber: string,
): Promise<GenerateOtpResponse> {
  const encData = JSON.stringify({ mobile_number: mobileNumber });
  const response = await api.post(ENDPOINTS.sendOtp, { enc_data: encData });

  if (!response.data || response.data.status !== 0) {
    throw new Error(
      response.data?.message ||
        'Failed to send OTP. Please check mobile number and try again.',
    );
  }

  const raw = response.data.data;
  const parsed: GenerateOtpResponse =
    typeof raw === 'string' ? JSON.parse(raw) : raw;
  return parsed;
}

/**
 * Validates the OTP entered by the user.
 * Returns user info on success.
 */
export async function validateOtp(
  mobileNumber: string,
  otp: string,
): Promise<ValidateOtpResponse> {
  const encData = JSON.stringify({ mobile_number: mobileNumber, otp });
  const response = await api.post(ENDPOINTS.verifyOtp, { enc_data: encData });

  if (!response.data || response.data.status !== 0) {
    throw new Error(
      response.data?.message || 'Invalid OTP entered. Please try again.',
    );
  }

  const raw = response.data.data;
  const parsed: ValidateOtpResponse =
    typeof raw === 'string' ? JSON.parse(raw) : raw;

  // Requirement: fetch token strictly AFTER validate_otp succeeds
  await fetchFreshToken();

  // Always include the mobileNumber used for login in the returned object
  return { ...parsed, mobile: parsed.mobile || parsed.mobile_no || mobileNumber };
}
