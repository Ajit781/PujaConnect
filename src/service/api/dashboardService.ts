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

export interface SummaryCount {
  total_user_qty: number;
  total_temple_qty: number;
  total_astrologer_qty: number;
  total_registered_priest_qty: number;
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
