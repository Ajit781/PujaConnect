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
  getPujaImages: '/citizen/get_puja_image_details_by_puja_id',
  getPujaPackages: '/citizen/get_puja_package_details_by_puja_id',
  getPackageMaterials: '/citizen/get_puja_materials_details_by_package_id',
  getPujaFullDetails: '/citizen/get_puja_details_by_puja_id',
  addPujaToCart: '/citizen/add_puja_cart',
  getPujaCartInfo: '/citizen/get_puja_cart_info',
  managePujaCart: '/citizen/manage_puja_cart',
  savePujaTag: '/citizen/save_puja_tag',
  saveUserProfile: '/citizen/save_user_profile',
  getUserDetails: '/citizen/get_user_details_by_user_id',
  saveRelativeDetails: '/citizen/save_relative_details',
  deleteRelativeDetails: '/citizen/delete_relative_details',
  saveAddress: '/citizen/save_address',
  getAddresses: '/citizen/get_addresses',
  saveDefaultAddress: '/citizen/save_default_address',
  bookPuja: '/citizen/book_puja',
};

// Validation constants
export const VALIDATION = {
  MOBILE_LENGTH: 10,
  OTP_LENGTH: 6,
  MOBILE_REGEX: /^[6-9]\d{9}$/, // Indian mobile: starts with 6-9, exactly 10 digits
};

export { SYSTEM_BASIC_AUTH };
