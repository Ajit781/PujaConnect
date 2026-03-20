import api from './index';
import { ENDPOINTS } from '../../config/apiConfig';

export interface AddressType {
  address_type_id: number;
  address_type: string;
}

/**
 * Fetches all address types (Home, Work, etc.) from the master API.
 */
export async function getAllAddressTypes(): Promise<AddressType[]> {
  try {
    const response = await api.post(ENDPOINTS.getAddressTypes, {});

    if (response.data.status !== 0) {
      throw new Error(response.data.message || 'Failed to fetch address types');
    }

    // data is a stringified JSON array
    const dataStr = response.data.data;
    if (!dataStr) return [];

    const parsed: AddressType[] = JSON.parse(dataStr);
    return parsed;
  } catch (error: any) {
    console.error('[AddressService] Error fetching address types:', error);
    throw error;
  }
}
