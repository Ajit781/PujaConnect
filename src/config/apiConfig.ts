// Hardcoded for now because Metro Bundler caching is broken on Windows for .env plugins
export const API_BASE_URL = 'http://115.187.62.16:8005/PujaConnectRestAPI/api';

const SYSTEM_BASIC_AUTH = 'YURtaW4jVG9rZW4kR2VOYVJhVGUyNjphZG1pbkAxMjM=';

export const ENDPOINTS = {
  generateToken: '/auth/generateToken',
  sendOtp: '/auth/citizen_generate_otp_mobile',
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
  getPujaCartSummary: '/citizen/get_puja_cart_summary',
  managePujaCart: '/citizen/manage_puja_cart',
  savePujaTag: '/citizen/save_puja_tag',
  saveUserProfile: '/citizen/save_user_profile',
  saveUserProfileImage: '/citizen/save_user_profile_image',
  getUserDetails: '/citizen/get_user_details_by_user_id_v1',
  saveRelativeDetails: '/citizen/save_relative_details_v1',
  deleteRelativeDetails: '/citizen/delete_relative_details',
  saveAddress: '/citizen/save_address',
  saveAddressV1: '/citizen/save_address_v1',
  getAddresses: '/citizen/get_addresses_v1',
  getAddressesCount: '/citizen/get_addresses_count',
  saveDefaultAddress: '/citizen/save_default_address',
  deleteAddress: '/citizen/delete_address',
  bookPuja: '/citizen/book_puja',
  getOrderSummary: '/citizen/get_order_summary',
  getBookingDetails: '/citizen/get_booking_details_by_id',
  reschedulePuja: '/citizen/reschedule_puja',
  cancelPuja: '/citizen/cancel_puja',
  getAllPujaCount: '/home/get_all_puja_count',
  getOrderSummaryCount: '/citizen/get_order_summary_count',
  getGotraDetails: '/master/get_gotra_details',
  getStateDetails: '/master/get_all_states',
  getStatusType: '/master/get_status_type',
  getCheckoutDetailsByOrderId: '/citizen/get_check_out_details_by_order_id',
  getInvoiceDetails: '/citizen/get_invoice_details',
};

// Validation constants
export const VALIDATION = {
  MOBILE_LENGTH: 10,
  OTP_LENGTH: 6,
  MOBILE_REGEX: /^[6-9]\d{9}$/, // Indian mobile: starts with 6-9, exactly 10 digits
};

export { SYSTEM_BASIC_AUTH };
