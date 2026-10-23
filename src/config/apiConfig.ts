
// Staging URL: 'http://115.187.62.16:8005/PujaConnectRestAPI/api'
//export const API_BASE_URL = 'http://115.187.62.16:8005/PujaConnectRestAPI/api';
export const API_BASE_URL = 'https://subhmuhurat.com/PujaConnectRestAPI/api';


console.log(' CURRENT API BASE URL IS:', API_BASE_URL);

export const isProductionEnv = (): boolean => {
  return !API_BASE_URL.includes('115.187.62.16');
};

export const IMAGE_BASE_URL = API_BASE_URL.replace('/PujaConnectRestAPI/api', '');

// Payment Redirect and Mobile Callback URLs (Derived directly from single API_BASE_URL)
export const PAYMENT_API_REDIRECT_URL = `${API_BASE_URL}/citizen/update_payment_status_v1`;
export const PAYMENT_CALLBACK_URL = `${API_BASE_URL}/citizen/update_payment_status_v1_mobile`;

// Encryption Key Config (Matches PujaConnect_Admin VITE_KEY_SECRET & VITE_ENV)
export const CRYPTO_CONFIG = {
  KEY_SECRET: '710f5a3bbcb3c168409c47774ba11897be76f08e997085377803271c4d42e961',
  get IS_ENV(): 'PRODUCTION' | 'STAGING' {
    return isProductionEnv() ? 'PRODUCTION' : 'STAGING';
  },
};

const SYSTEM_BASIC_AUTH = 'YURtaW4jVG9rZW4kR2VOYVJhVGUyNjphZG1pbkAxMjM=';

export const ENDPOINTS = {
  generateToken: '/auth/generate_token_v1',
  sendOtp: '/auth/generate_otp_v1',
  verifyOtp: '/auth/validate_otp_v1',
  getPujaTypes: '/master/get_all_puja_type',
  getAddressTypes: '/master/get_all_address_type',
  getAllPurpose: '/master/get_all_purpose',
  getPujaTags: '/master/get_puja_tag_info',
  getSummaryCount: '/home/get_summary_count',
  getTagPujas: '/citizen/get_tag_pujas_v2',
  getPujaImages: '/citizen/get_puja_image_details_by_puja_id',
  getPujaPackages: '/citizen/get_puja_package_details_by_puja_id',
  getPackageMaterials: '/citizen/get_puja_materials_details_by_package_id',
  getPujaFullDetails: '/citizen/get_puja_details_by_puja_id',
  addPujaToCart: '/citizen/add_puja_cart',
  getPujaCartInfo: '/citizen/get_puja_cart_info',
  getPujaCartSummary: '/citizen/get_puja_cart_summary',
  managePujaCart: '/citizen/manage_puja_cart',
  savePujaTag: '/citizen/save_puja_tag_v1',
  saveUserProfile: '/citizen/save_user_profile',
  saveUserProfileImage: '/citizen/save_user_profile_image_v1',
  getUserDetails: '/citizen/get_user_details_by_user_id_v1',
  saveRelativeDetails: '/citizen/save_relative_details_v1',
  deleteRelativeDetails: '/citizen/delete_relative_details',
  saveAddress: '/citizen/save_address',
  saveAddressV1: '/citizen/save_address_v1',
  getAddresses: '/citizen/get_addresses_v1',
  getAddressesCount: '/citizen/get_addresses_count',
  saveDefaultAddress: '/citizen/save_default_address',
  deleteAddress: '/citizen/delete_address',
  bookPuja: '/citizen/book_puja_v1',
  getOrderSummary: '/citizen/get_order_summary',
  getBookingSummary: '/citizen/get_booking_summary_v1',
  getBookingDetails: '/citizen/get_booking_details_by_id',
  reschedulePuja: '/citizen/reschedule_puja_v1',
  cancelPuja: '/citizen/cancel_puja',
  getAllPujaCount: '/home/get_all_puja_count',
  getOrderSummaryCount: '/citizen/get_order_summary_count',
  getBookingSummaryCount: '/citizen/get_booking_summary_count',
  getGotraDetails: '/master/get_gotra_details',
  getStateDetails: '/master/get_all_states',
  getStatusType: '/master/get_status_type',
  getCheckoutDetailsByOrderId: '/citizen/get_check_out_details_by_order_id',
  getIntiatePaymentDetailsByOrderId: '/citizen/get_intiate_payment_details_by_order_id',
  getInvoiceDetails: '/citizen/get_invoice_details',
  updatePaymentStatus: '/citizen/update_payment_status_v1',
  getPujaReviewDetails: '/citizen/get_puja_review_details_v1',
  getPujaPolicyDetails: '/citizen/get_puja_policy_details',
};

// Paytm Merchant Credentials Config (Auto-switches based on API_BASE_URL)
export const PAYTM_CONFIG = {
  get BASE_URL() {
    return isProductionEnv()
      ? 'https://securegw.paytm.in/'
      : 'https://securestage.paytmpayments.com/';
  },
  MID: 'gOPUVm93533483285767',
  get IS_STAGING() {
    return !isProductionEnv();
  },
  RESTRICT_APP_INVOKE: false,
  URL_SCHEME: 'paytmgOPUVm93533483285767',
};

export const VALIDATION = {
  MOBILE_LENGTH: 10,
  OTP_LENGTH: 6,
  MOBILE_REGEX: /^[6-9]\d{9}$/,
};

export { SYSTEM_BASIC_AUTH };
