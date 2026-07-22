import api from './index';
import { ENDPOINTS } from '../../config/apiConfig';

export interface PujaType {
  puja_type_id: number;
  puja_duration: number;
  puja_type_name: string;
  puja_with_samagri_amount: number;
  puja_without_samagri_amount: number;
  // Citizen API fields
  puja_id?: number;
  puja_name?: string;
  icon?: string;
  duration?: string;
  minimum_price?: number;
  maximum_price?: number;
  is_favourite_puja?: number;
  puja_rating?: number;
  description?: string;
  puja_description?: string;
  puja_active_status?: number;
}

export interface PujaTag {
  tag_id: number;
  tag_value: string;
}

export interface PujaImage {
  puja_id: number;
  puja_icon: string;
  puja_name: string;
  puja_image: string;
}

export interface PujaPackage {
  puja_id: number;
  puja_name: string;
  description: string;
  pandit_count: number;
  puja_duration: number;
  puja_package_id: number;
  puja_package_name: string;
  puja_package_price: number;
  puja_include_samagri: number;
  puja_package_description: string;
}

export interface PujaMaterial {
  quantity: number;
  stock_qty: number;
  package_id: number;
  unit_price: number;
  category_id: number;
  material_id: number;
  total_price: number;
  min_order_qty: number;
  category_name: string;
  material_name: string;
  material_rate: number;
  material_unit: string;
  material_img_url: string;
  material_hsn_code: string;
  material_remarks: string;
  material_description: string;
}

export interface PujaFullDetails {
  icon: string;
  puja_id: number;
  duration: string;
  puja_name: string;
  puja_rating: number;
  description: string;
  puja_benifit: string;
  puja_sub_name: string;
  redirect_url: string;
  maximum_price: number;
  puja_key_insight: string;
  puja_our_promise: string;
  puja_significance: string;
  puja_history_details: string;
}
export interface SummaryCount {
  total_user_qty: number;
  total_temple_qty: number;
  total_astrologer_qty: number;
  total_registered_priest_qty: number;
}

export interface PujaCartItem {
  icon: string;
  pkg_id: number;
  cart_id: number;
  puja_id: number;
  pkg_name: string;
  duration: number;
  pkg_price: number;
  puja_name: string;
  cart_item_id: number;
  puja_rating: number;
  pkg_quantity: number;
  pkg_pandit_qty: number;
  pkg_description: string;
  puja_key_insight: string;
  preferred_puja_date: string;
  preferred_puja_time: string;
}

export interface BookingSummary {
  booking_id: number;
  booking_no: string;
  booking_create_date: string;
  total_amount: number;
  total_amount_paid: number;
  payment_status: string;
  booking_status: string;
}

export interface BookingDetail {
  booking_id: number;
  booking_no: string;
  booking_create_date: string;
  puja_id: number;
  package_id: number;
  puja_name: string;
  puja_description: string;
  package_name: string;
  package_description: string;
  pandit_count: number;
  duration_hours: number;
  preferred_date: string;
  preferred_time: string;
  package_total_amount: number;
  puja_item_booking_status: string;
}

export interface OrderPackageDetail {
  package_id: number;
  package_name: string;
  preferred_date: string;
  preferred_time: string;
  citizen_address_id: number;
  citizen_address: string;
  citizen_city: string;
  citizen_pin_code: string;
  citizen_land_mark: string;
  special_instructions: string;
  package_amount: number;
  package_status_id: number;
  package_status: string;
  package_cancel_reason: string;
}

export interface OrderBookingDetail {
  booking_id: number;
  booking_no: string;
  booking_status_id: number;
  booking_status: string;
  booking_cancel_reason: string;
  package_details: OrderPackageDetail[];
}

export interface OrderSummary {
  citizen_id: number;
  order_id: number;
  order_reference: string;
  order_payble_amount: number;
  order_total_amount: number;
  order_status_id: number;
  order_status: string;
  order_cancel_reason: string;
  booking_details: OrderBookingDetail[];
}

/**
 * Fetches all puja types from the master API.
 * @param userId The ID of the logged-in user.
 */
export async function getAllPujaTypes(userId: number): Promise<PujaType[]> {
  const encData = JSON.stringify({ login_user_id: userId });

  try {
    const response = await api.post(ENDPOINTS.getPujaTypes, {
      enc_data: encData,
    });

    if (response.data.status !== 0) {
      throw new Error(response.data.message || 'Failed to fetch puja types');
    }

    // data is a stringified JSON array
    const dataStr = response.data.data;
    if (!dataStr) return [];

    const parsed: PujaType[] = JSON.parse(dataStr);
    return parsed;
  } catch (error: any) {
    console.error('[DashboardService] Error fetching puja types:', error);
    throw error;
  }
}
/**
 * Fetches all puja tags (All, Featured, etc.) from the master API.
 */
export async function getAllPujaTags(): Promise<PujaTag[]> {
  try {
    const response = await api.post(ENDPOINTS.getPujaTags, {});

    if (response.data.status !== 0) {
      throw new Error(response.data.message || 'Failed to fetch puja tags');
    }

    const dataStr = response.data.data;
    if (!dataStr) return [];

    const parsed: PujaTag[] = JSON.parse(dataStr);
    return parsed;
  } catch (error: any) {
    console.error('[DashboardService] Error fetching puja tags:', error);
    throw error;
  }
}

/**
 * Fetches summary counts (users, temples, priests, etc.) from the home API.
 */
export async function getSummaryCount(): Promise<SummaryCount> {
  try {
    const response = await api.post(ENDPOINTS.getSummaryCount, {});

    if (response.data.status !== 0) {
      throw new Error(response.data.message || 'Failed to fetch summary count');
    }

    const dataStr = response.data.data;
    if (!dataStr) {
      return {
        total_user_qty: 0,
        total_temple_qty: 0,
        total_astrologer_qty: 0,
        total_registered_priest_qty: 0,
      };
    }

    const parsed: SummaryCount = JSON.parse(dataStr);
    return parsed;
  } catch (error: any) {
    console.error('[DashboardService] Error fetching summary count:', error);
    throw error;
  }
}

/**
 * Fetches pujas filtered by tag from the citizen API.
 */
export async function getPujaByTag(
  userId: number,
  tagId: number,
  pageNo: number = 1,
  limit: number = 10,
): Promise<PujaType[]> {
  const encData = JSON.stringify({
    page_no: pageNo,
    limit: limit,
    puja_tag_id: tagId,
    ctnz_id: userId,
  });

  try {
    const response = await api.post(ENDPOINTS.getTagPujas, {
      enc_data: encData,
    });

    if (response.data.status !== 0) {
      throw new Error(response.data.message || 'Failed to fetch tagged pujas');
    }

    const dataStr = response.data.data;
    if (!dataStr) return [];

    const parsed: PujaType[] = JSON.parse(dataStr);
    return parsed;
  } catch (error: any) {
    console.error('[DashboardService] Error fetching tagged pujas:', error);
    throw error;
  }
}
