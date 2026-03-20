// Hardcoded for now because Metro Bundler caching is broken on Windows for .env plugins
export const API_BASE_URL = 'http://115.187.62.16:8005/PujaConnectRestAPI/api';

const SYSTEM_BASIC_AUTH = 'YURtaW4jVG9rZW4kR2VOYVJhVGUyNjphZG1pbkAxMjM=';

export const ENDPOINTS = {
  generateToken: '/auth/generateToken',
  sendOtp: '/auth/citizen_generate_otp',
  verifyOtp: '/auth/citizen_validate_otp',
  getPujaTypes: '/master/get_all_puja_type',
  getAddressTypes: '/master/get_all_address_type',
  getPujaTags: '/master/get_puja_tag_info',
  getSummaryCount: '/home/get_summary_count',
  getTagPujas: '/citizen/get_tag_pujas',
};

// Validation constants
export const VALIDATION = {
  MOBILE_LENGTH: 10,
  OTP_LENGTH: 6,
  MOBILE_REGEX: /^[6-9]\d{9}$/, // Indian mobile: starts with 6-9, exactly 10 digits
};

export { SYSTEM_BASIC_AUTH };
