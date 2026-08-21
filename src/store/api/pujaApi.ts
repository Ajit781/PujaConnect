import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL, ENDPOINTS } from '../../config/apiConfig';
import {
  PujaType,
  PujaTag,
  PujaImage,
  PujaPackage,
  PujaMaterial,
  SummaryCount,
  PujaFullDetails,
  PujaCartItem,
  BookingSummary,
  BookingDetail,
  OrderSummary,
} from '../../service/api/dashboardService';
import {
  getSystemToken,
  clearSystemToken,
} from '../../service/api/tokenService';
import {
  handleApiBusinessError,
  handleApiHttpError,
} from '../../service/api/apiErrorHandler';

import { showLoader, hideLoader } from '../slices/loaderSlice';
import { toggleFavorite } from '../slices/wishlistSlice';
import { logout } from '../slices/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  timeout: 30000,
  prepareHeaders: async (headers, { endpoint }) => {
    // Priority 1: System token from AsyncStorage (used by existing logic)
    const token = await getSystemToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('accept', '*/*');
    if (endpoint === 'saveUserProfileImage' || endpoint === 'saveUserProfile') {
      headers.delete('Content-Type');
    } else {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const url = typeof args === 'string' ? args : args?.url;

  // Explicitly skip global loader for wishlist-related operations (background processing)
  const skipGlobal =
    extraOptions?.skipGlobalLoader ||
    args?.skipGlobalLoader ||
    url?.includes('/citizen/get_tag_pujas') ||
    url?.includes('/citizen/save_puja_tag');

  // Start global loader if not skipped
  if (!skipGlobal) {
    api.dispatch(showLoader());
  }

  const token = await getSystemToken();
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    const statusStr = result.error.status;
    const httpStatus = typeof statusStr === 'number' ? statusStr : undefined;
    const errorUrl = typeof args === 'string' ? args : args?.url;

    if (httpStatus === 401) {
      if (token) {
        // Token was sent but expired or invalid
        console.log('Detected 401 with Token - Logging out via Context');
        await clearSystemToken();
        api.dispatch(logout()); // Ensure state clears locally
        handleApiHttpError(401, url);
      } else {
        console.log('Detected 401 but NO token was sent. Skipping logout.');
      }
    } else {
      // Other HTTP errors (500, etc)
      handleApiHttpError(httpStatus, errorUrl);
    }
  } else if (result.data) {
    const resData = result.data as any;
    if (resData && typeof resData.status === 'number') {
      // Show CustomAlert globally if status isn't 0
      handleApiBusinessError(resData);
    }
  }

  // Stop global loader if not skipped
  if (!skipGlobal) {
    api.dispatch(hideLoader());
  }

  return result;
};

export const pujaApi = createApi({
  reducerPath: 'pujaApi',
  baseQuery: baseQueryWithReauth,
  refetchOnReconnect: true,
  tagTypes: ['Pujas', 'Tags', 'Cart', 'UserDetails', 'Addresses', 'Orders'],
  endpoints: builder => ({
    getPujaTags: builder.query<PujaTag[], void>({
      query: () => ({
        url: ENDPOINTS.getPujaTags,
        method: 'POST',
      }),
      transformResponse: (response: any) => {
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return Array.isArray(data) ? data : [];
        }
        return [];
      },
      providesTags: ['Tags'],
    }),
    getTagPujas: builder.query<
      PujaType[],
      { userId: number; tagId: number; pageNo: number; limit: number; purposeId?: number }
    >({
      query: ({ userId, tagId, pageNo, limit, purposeId = 0 }) => ({
        url: ENDPOINTS.getTagPujas,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            page_no: pageNo || 1,
            limit: limit || 30,
            puja_tag_id: tagId,
            ctnz_id: userId,
            purpose_id: purposeId || 0,
          }),
        },
      }),
      transformResponse: (response: any) => {
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return Array.isArray(data) ? data : [];
        }
        return [];
      },
      providesTags: result =>
        result
          ? [
            ...result.map((p: any) => ({
              type: 'Pujas' as const,
              id: p.puja_id || p.puja_type_id,
            })),
            { type: 'Pujas', id: 'LIST' },
          ]
          : [{ type: 'Pujas', id: 'LIST' }],
    }),
    getPujaImages: builder.query<PujaImage[], string>({
      query: pujaId => ({
        url: ENDPOINTS.getPujaImages,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            puja_id: pujaId,
          }),
        },
      }),
      transformResponse: (response: any) => {
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return Array.isArray(data) ? data : [];
        }
        return [];
      },
    }),
    getPujaPackages: builder.query<PujaPackage[], string>({
      query: pujaId => ({
        url: ENDPOINTS.getPujaPackages,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            puja_id: pujaId,
          }),
        },
      }),
      transformResponse: (response: any) => {
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return Array.isArray(data) ? data : [];
        }
        return [];
      },
    }),
    getPackageMaterials: builder.query<
      PujaMaterial[],
      { pujaId: string; packageId: string }
    >({
      query: ({ pujaId, packageId }) => ({
        url: ENDPOINTS.getPackageMaterials,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            puja_id: pujaId,
            package_id: packageId,
          }),
        },
      }),
      transformResponse: (response: any) => {
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return Array.isArray(data) ? data : [];
        }
        return [];
      },
    }),
    getPujaFullDetails: builder.query<PujaFullDetails | null, string>({
      query: pujaId => ({
        url: ENDPOINTS.getPujaFullDetails,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            puja_id: pujaId,
          }),
        },
      }),
      transformResponse: (response: any) => {
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return data || null;
        }
        return null;
      },
    }),
    addPujaToCart: builder.mutation<
      {
        status: number;
        message: string;
        data: { cart_id: number; cart_item_id: number } | null;
      },
      {
        ctzn_id: number;
        puja_id: number;
        package_id: number;
        p_preferred_date: string;
        p_preferred_time: string;
        quantity: number;
      }
    >({
      query: body => {
        const finalPayload = {
          enc_data: JSON.stringify(body),
        };
        console.log(
          '--- API: addPujaToCart BODY ---',
          JSON.stringify(finalPayload, null, 2),
        );
        return {
          url: ENDPOINTS.addPujaToCart,
          method: 'POST',
          body: finalPayload,
        };
      },
      transformResponse: (response: any) => {
        console.log('add_puja_cart Response:', response);
        const parsedData =
          typeof response.data === 'string'
            ? JSON.parse(response.data)
            : response.data;
        return {
          status: response.status,
          message: response.message || '',
          data: parsedData || null,
        };
      },
      invalidatesTags: ['Cart'],
    }),
    getPujaCartInfo: builder.query<
      PujaCartItem[],
      { pageNo: number; limit: number; userId: number }
    >({
      query: ({ pageNo, limit, userId }) => ({
        url: ENDPOINTS.getPujaCartInfo,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            page_no: pageNo,
            limit: limit,
            ctzn_id: userId,
          }),
        },
      }),
      transformResponse: (response: any) => {
        console.log('--- API: getPujaCartInfo RESPONSE ---', response);
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return Array.isArray(data) ? data : [];
        }
        return [];
      },
      providesTags: ['Cart'],
    }),
    getPujaCartSummary: builder.query<
      {
        cart_value: number;
        platform_charges: number;
        platform_charges_gst: number;
        total_booking_amount: number;
        total_payable_amount: number;
      } | null,
      { cartId: number | string; userId: number | string }
    >({
      query: ({ cartId, userId }) => ({
        url: ENDPOINTS.getPujaCartSummary,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            cart_id: Number(cartId),
            ctzn_id: Number(userId),
          }),
        },
      }),
      transformResponse: (response: any) => {
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return data || null;
        }
        return null;
      },
      providesTags: ['Cart'],
    }),
    managePujaCart: builder.mutation<
      { status: number; message: string; data: any },
      { ctzn_id: number; cart_item_id: number; action: number }
    >({
      query: body => {
        const finalPayload = {
          enc_data: JSON.stringify(body),
        };
        console.log(
          '--- API: managePujaCart BODY ---',
          JSON.stringify(finalPayload, null, 2),
        );
        return {
          url: ENDPOINTS.managePujaCart,
          method: 'POST',
          body: finalPayload,
        };
      },
      transformResponse: (response: any) => {
        console.log('manage_puja_cart Response:', response);
        return response;
      },
      invalidatesTags: ['Cart'],
    }),
    savePujaTag: builder.mutation<
      { status: number; message: string; data: any },
      {
        userId: number;
        pujaId: number;
        tagId: number;
        action: number;
        skipGlobalLoader?: boolean;
      }
    >({
      query: ({ userId, pujaId, tagId, action, skipGlobalLoader }) => ({
        url: ENDPOINTS.savePujaTag,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            ctzn_id: userId,
            puja_id: pujaId,
            puja_tag_id: tagId,
            action,
          }),
        },
        skipGlobalLoader, // Passed to baseQuery
      }),
      invalidatesTags: ['Pujas'],
      async onQueryStarted({ pujaId }, { dispatch, queryFulfilled }) {
        // Optimistically update the favorites slice (local state for heart icons)
        // action 1 = save, 5 = remove (as per user correction)
        dispatch(toggleFavorite(pujaId.toString()));

        try {
          await queryFulfilled;
        } catch {
          // Revert if API fails
          dispatch(toggleFavorite(pujaId.toString()));
        }
      },
    }),
    getUserDetails: builder.query<any, string | number>({
      query: userId => {
        const payload = {
          enc_data: JSON.stringify({ user_id: userId ? userId.toString() : '0' }),
        };
        console.log('==============================================');
        console.log('--- API: getUserDetails REQUEST DATA ---');
        console.log('userId:', userId);
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('==============================================');
        return {
          url: ENDPOINTS.getUserDetails,
          method: 'POST',
          body: payload,
        };
      },
      transformResponse: (response: any) => {
        console.log('==============================================');
        console.log('--- API: getUserDetails SERVER RESPONSE ---', response);
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          console.log('Decoded getUserDetails Data:', data);
          console.log('==============================================');
          return data;
        }
        console.log('==============================================');
        return null;
      },
      providesTags: ['UserDetails'],
    }),
    saveRelativeDetails: builder.mutation<
      { status: number; message: string; data: any },
      { data: string }
    >({
      query: ({ data }) => {
        console.log('==============================================');
        console.log('--- API: saveRelativeDetails REQUEST DATA ---');
        console.log('Raw Data String:', data);
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.enc_data) {
            console.log('Decoded enc_data Object:', JSON.parse(parsedData.enc_data));
          }
        } catch (e) { }
        console.log('==============================================');
        return {
          url: ENDPOINTS.saveRelativeDetails,
          method: 'POST',
          body: data,
          headers: { 'Content-Type': 'application/json' },
        };
      },
      transformResponse: (response: any) => {
        console.log('==============================================');
        console.log('--- API: saveRelativeDetails SERVER RESPONSE ---', response);
        console.log('==============================================');
        return response;
      },
      invalidatesTags: ['UserDetails'],
    }),
    deleteRelativeDetails: builder.mutation<
      { status: number; message: string; data: any },
      { data: string }
    >({
      query: ({ data }) => ({
        url: ENDPOINTS.deleteRelativeDetails,
        method: 'POST',
        body: data,
        headers: { 'Content-Type': 'application/json' },
      }),
      invalidatesTags: ['UserDetails'],
    }),
    saveUserProfile: builder.mutation<
      { status: number; message: string; data: any },
      { data: string; file?: any }
    >({
      query: ({ data, file }) => {
        const formData = new FormData();
        formData.append('data', data);
        console.log('==============================================');
        console.log('--- API: saveUserProfile REQUEST DATA ---');
        console.log('Raw Data String:', data);
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.enc_data) {
            console.log('Decoded enc_data Object:', JSON.parse(parsedData.enc_data));
          }
        } catch (e) { }
        console.log('File attached:', file?.name || file?.uri || 'No File');
        console.log('==============================================');
        if (file) {
          formData.append('file', file);
        }
        return {
          url: ENDPOINTS.saveUserProfile,
          method: 'POST',
          body: formData,
        };
      },
      transformResponse: (response: any) => {
        console.log('==============================================');
        console.log('--- API: saveUserProfile SERVER RESPONSE ---', JSON.stringify(response, null, 2));
        console.log('==============================================');
        return response;
      },
      invalidatesTags: ['UserDetails'],
    }),
    saveUserProfileImage: builder.mutation<
      { status: number; message: string; data: any },
      { authId: number | string; file: any }
    >({
      query: ({ authId, file }) => {
        const formData = new FormData();
        const numId = Number(authId) || 0;
        const dataValue = `{"enc_data": "{\\"auth_id\\":${numId}}"}`;
        formData.append('data', dataValue);

        const filePayload = file
          ? {
            uri: file.uri,
            type: file.type || 'image/jpeg',
            name: file.name || file.fileName || `profile_${numId}.jpg`,
          }
          : null;
        if (filePayload) {
          formData.append('file', filePayload as any);
        }
        console.log('==============================================');
        console.log('--- API: saveUserProfileImage REQUEST DATA ---');
        console.log('authId:', numId);
        console.log('data:', dataValue);
        console.log('file Payload:', JSON.stringify(filePayload, null, 2));
        console.log('==============================================');
        return {
          url: ENDPOINTS.saveUserProfileImage,
          method: 'POST',
          body: formData,
        };
      },
      transformResponse: (response: any) => {
        console.log('==============================================');
        console.log('--- API: saveUserProfileImage SERVER RESPONSE ---', response);
        console.log('==============================================');
        return response;
      },
      invalidatesTags: ['UserDetails'],
    }),
    saveAddress: builder.mutation<
      { status: number; message: string; data: any },
      { data: string }
    >({
      query: ({ data }) => {
        console.log('--- API: saveAddress PAYLOAD ---', data);
        return {
          url: ENDPOINTS.saveAddress,
          method: 'POST',
          body: data,
          headers: { 'Content-Type': 'application/json' },
        };
      },
      transformResponse: (response: any) => {
        console.log('--- API: saveAddress RESPONSE ---', response);
        return response;
      },
      invalidatesTags: ['Addresses'],
    }),
    saveAddressV1: builder.mutation<
      { status: number; message: string; data: any },
      { data: string }
    >({
      query: ({ data }) => {
        console.log('--- API: saveAddressV1 PAYLOAD ---', data);
        return {
          url: ENDPOINTS.saveAddressV1,
          method: 'POST',
          body: data,
          headers: { 'Content-Type': 'application/json' },
        };
      },
      transformResponse: (response: any) => {
        console.log('--- API: saveAddressV1 RESPONSE ---', response);
        return response;
      },
      invalidatesTags: ['Addresses'],
    }),
    deleteAddress: builder.mutation<
      { status: number; message: string; data: any },
      { data: string }
    >({
      query: ({ data }) => {
        console.log('--- API: deleteAddress PAYLOAD ---', data);
        return {
          url: ENDPOINTS.deleteAddress,
          method: 'POST',
          body: data,
          headers: { 'Content-Type': 'application/json' },
        };
      },
      transformResponse: (response: any) => {
        console.log('--- API: deleteAddress RESPONSE ---', response);
        return response;
      },
      invalidatesTags: ['Addresses'],
    }),
    getAddresses: builder.query<
      any,
      {
        userId: string | number;
        pageNo: number;
        pageSize: number;
      }
    >({
      query: ({ userId, pageNo = 1, pageSize = 10 }) => {
        const payload = {
          enc_data: JSON.stringify({
            auth_id: Number(userId),
            page_no: pageNo,
            page_size: pageSize,
          }),
        };
        console.log(
          '--- API: getAddresses PAYLOAD ---',
          JSON.stringify(payload, null, 2),
        );
        return {
          url: ENDPOINTS.getAddresses,
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
        };
      },
      transformResponse: (response: any) => {
        console.log('--- API: getAddresses RESPONSE ---', response);
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return data;
        }
        return null;
      },
      providesTags: ['Addresses'],
    }),
    saveDefaultAddress: builder.mutation<
      { status: number; message: string; data: any },
      { userId: string | number; addressId: string | number }
    >({
      query: ({ userId, addressId }) => {
        const payload = {
          enc_data: JSON.stringify({
            ctzn_id: Number(userId),
            ctzn_address_id: Number(addressId),
          }),
        };
        console.log(
          '--- API: saveDefaultAddress PAYLOAD ---',
          JSON.stringify(payload, null, 2),
        );
        return {
          url: ENDPOINTS.saveDefaultAddress,
          method: 'POST',
          body: payload,
        };
      },
      transformResponse: (response: any) => {
        console.log('--- API: saveDefaultAddress RESPONSE ---', response);
        return response;
      },
      invalidatesTags: ['Addresses'],
    }),
    bookPuja: builder.mutation<
      { status: number; message: string; data: any },
      {
        in_booking_id: number;
        ctzn_id: number;
        cart_id: number;
        payment_mode: number;
        payment_status: number;
        payable_amount: number;
        total_amount: number;
        ctzn_address_id?: number;
        puja_schedule_list: {
          package_id: number;
          preferred_date: string;
          preferred_time: string;
          ctzn_address_id?: number;
        }[];
      }
    >({
      query: payloadObj => {
        const payload = {
          enc_data: JSON.stringify(payloadObj),
        };
        console.log(
          '--- API: bookPuja PAYLOAD ---',
          JSON.stringify(payload, null, 2),
        );
        return {
          url: ENDPOINTS.bookPuja,
          method: 'POST',
          body: payload,
        };
      },
      transformResponse: (response: any) => {
        console.log('--- API: bookPuja RESPONSE ---', response);
        return response;
      },
      invalidatesTags: ['Cart'],
    }),
    getOrderSummary: builder.query<
      OrderSummary[],
      {
        userId: number;
        status: number;
        paymentStatus: number;
        pageNo: number;
        pageSize: number;
        fromDate: string | null;
        toDate: string | null;
      }
    >({
      query: ({
        userId,
        status,
        paymentStatus,
        pageNo,
        pageSize,
        fromDate,
        toDate,
      }) => ({
        url: ENDPOINTS.getOrderSummary,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            citizen_id: userId,
            order_status: status,
            start_date: fromDate,
            end_date: toDate,
            page_no: pageNo,
            limit: pageSize,
          }),
        },
      }),
      transformResponse: (response: any) => {
        console.log('--- API: getOrderSummary RESPONSE ---', response);
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;

          if (Array.isArray(data)) {
            return data.map((item: any) => ({
              ...item,
              booking_id: item.booking_id || item.order_id,
              booking_no: item.booking_no || item.order_no || item.order_ref,
              booking_create_date: item.booking_create_date || item.order_date || item.created_at,
              booking_status: item.booking_status || item.order_status_name || item.order_status,
              total_amount: item.total_amount || item.order_amount || 0,
              total_amount_paid: item.total_amount_paid || item.paid_amount || 0,
              payment_status: item.payment_status || item.payment_status_name || 'PENDING',
            }));
          }
          return [];
        }
        return [];
      },
      providesTags: ['Orders'],
    }),
    getBookingSummary: builder.query<
      OrderSummary[],
      {
        userId: number;
        status: number;
        paymentStatus: number;
        pageNo: number;
        pageSize: number;
        fromDate: string | null;
        toDate: string | null;
      }
    >({
      query: ({
        userId,
        status,
        paymentStatus,
        pageNo,
        pageSize,
        fromDate,
        toDate,
      }) => ({
        url: ENDPOINTS.getBookingSummary,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            citizen_id: userId,
            ctzn_id: userId,
            order_status: status,
            start_date: fromDate,
            end_date: toDate,
            page_no: pageNo,
            limit: pageSize,
          }),
        },
      }),
      transformResponse: (response: any) => {
        console.log('--- API: getBookingSummary (POST /citizen/get_booking_summary_v1) RESPONSE ---', response);
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;

          if (Array.isArray(data)) {
            return data.map((item: any) => ({
              ...item,
              booking_id: item.booking_id || item.order_id,
              booking_no: item.booking_no || item.order_no || item.order_ref,
              booking_create_date: item.booking_create_date || item.order_date || item.created_at,
              booking_status: item.booking_status || item.order_status_name || item.order_status,
              total_amount: item.total_amount || item.order_amount || 0,
              total_amount_paid: item.total_amount_paid || item.paid_amount || 0,
              payment_status: item.payment_status || item.payment_status_name || 'PENDING',
            }));
          }
          return [];
        }
        return [];
      },
      providesTags: ['Orders'],
    }),
    getBookingDetails: builder.query<any[], number | string | { bookingId: number | string; citizenId?: number | string }>({
      query: (arg) => {
        const bookingId = typeof arg === 'object' ? arg.bookingId : arg;
        const citizenId = typeof arg === 'object' ? arg.citizenId : 925;
        return {
          url: ENDPOINTS.getBookingDetails,
          method: 'POST',
          body: {
            enc_data: JSON.stringify({
              citizen_id: Number(citizenId || 925),
              booking_id: Number(bookingId),
            }),
          },
        };
      },
      transformResponse: (response: any) => {
        console.log('--- API: getBookingDetails RESPONSE ---', response);
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return Array.isArray(data) ? data : [];
        }
        return [];
      },
      providesTags: ['Orders'],
    }),
    reschedulePuja: builder.mutation<
      any,
      {
        bookingId: number | string;
        orderId?: number | string;
        ctznId: number | string;
        newDate: string; // YYYY-MM-DD
        newTime: string; // HH:mm
        addressId?: number | string;
      }
    >({
      query: ({ bookingId, orderId, ctznId, newDate, newTime, addressId }) => {
        const finalUserId = Number(ctznId) || 925;
        const payloadObj = {
          booking_id: Number(bookingId),
          order_id: Number(orderId || 0),
          ctzn_id: finalUserId,
          citizen_id: finalUserId,
          ctzn_user_id: finalUserId,
          new_preferred_date: newDate,
          new_preferred_time: newTime.length > 5 ? newTime.slice(0, 5) : newTime,
          address_id: Number(addressId || 0),
        };
        console.log('==============================================');
        console.log('--- API: reschedulePuja REQUEST ---');
        console.log('Endpoint:', ENDPOINTS.reschedulePuja);
        console.log('Payload Object:', payloadObj);
        console.log('==============================================');
        return {
          url: ENDPOINTS.reschedulePuja,
          method: 'POST',
          body: {
            enc_data: JSON.stringify(payloadObj),
          },
        };
      },
      transformResponse: (response: any) => {
        console.log('==============================================');
        console.log('--- API: reschedulePuja SERVER RESPONSE ---');
        console.log('Raw Response:', response);
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          console.log('Decoded Response Data:', data);
          console.log('==============================================');
          return { status: 0, message: response.message || 'Puja rescheduled successfully.', data };
        }
        console.log('==============================================');
        return response;
      },
      invalidatesTags: ['Orders'],
    }),
    cancelPuja: builder.mutation<
      any,
      {
        order_id: number | string;
        booking_id: number | string;
        package_id: number | string;
        reason: string;
        ctzn_id: number | string;
      }
    >({
      query: payload => ({
        url: ENDPOINTS.cancelPuja,
        method: 'POST',
        body: {
          enc_data: JSON.stringify(payload),
        },
      }),
      invalidatesTags: ['Orders'],
    }),
    getAllPujaCount: builder.query<number, { userId: number; tagId: number }>({
      query: ({ userId, tagId }) => ({
        url: ENDPOINTS.getAllPujaCount,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            ctzn_user_id: userId,
            puja_tag_id: tagId,
          }),
        },
      }),
      transformResponse: (response: any) => {
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return data?.total_puja_count || 0;
        }
        return 0;
      },
    }),
    getOrderSummaryCount: builder.query<
      number,
      {
        userId: number;
        status: number;
        paymentStatus: number;
        fromDate: string | null;
        toDate: string | null;
      }
    >({
      query: ({ userId, status, paymentStatus, fromDate, toDate }) => ({
        url: ENDPOINTS.getOrderSummaryCount,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            citizen_id: userId,
            order_status: status,
            start_date: fromDate,
            end_date: toDate,
          }),
        },
      }),
      transformResponse: (response: any) => {
        console.log('--- API: getOrderSummaryCount RAW RESPONSE ---', response);
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          console.log('--- API: getOrderSummaryCount PARSED DATA ---', data);
          if (Array.isArray(data) && data.length > 0) {
            return Number(data[0].total_puja_booking_summary_qty || data[0].total_booking_count || data[0].count || data.length);
          }
          if (typeof data === 'object' && data !== null) {
            return Number(data.total_puja_booking_summary_qty || data.total_booking_count || data.count || 0);
          }
          return Number(data) || 0;
        }
        return 0;
      },
    }),
    getGotraDetails: builder.query<{ gotra_id: number; gotra_name: string }[], void>({
      query: () => ({
        url: ENDPOINTS.getGotraDetails,
        method: 'POST',
        body: {},
      }),
      transformResponse: (response: any) => {
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return Array.isArray(data) ? data : [];
        }
        return [];
      },
    }),
    getStateDetails: builder.query<{ state_id: number; state_name: string }[], void>({
      query: () => ({
        url: ENDPOINTS.getStateDetails,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({ country_id: '75' }),
        },
      }),
      transformResponse: (response: any) => {
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return Array.isArray(data) ? data : [];
        }
        return [];
      },
    }),
    getStatusType: builder.query<{ status_type_id: number; status_type_name: string }[], void>({
      query: () => ({
        url: ENDPOINTS.getStatusType,
        method: 'POST',
      }),
      transformResponse: (response: any) => {
        console.log('--- API: getStatusType RAW RESPONSE ---', response);
        if (response && (response.status === 0 || response.status === '0')) {
          try {
            const data =
              typeof response.data === 'string'
                ? JSON.parse(response.data)
                : response.data;
            console.log('--- API: getStatusType PARSED DATA ---', data);
            return Array.isArray(data) ? data : [];
          } catch (e) {
            console.log('--- API: getStatusType PARSE ERROR ---', e);
            return [];
          }
        }
        return [];
      },
    }),
    getBookingSummaryCount: builder.query<
      number,
      {
        userId: number;
        status: number;
        paymentStatus: number;
        fromDate: string | null;
        toDate: string | null;
      }
    >({
      query: ({ userId, status, paymentStatus, fromDate, toDate }) => ({
        url: ENDPOINTS.getBookingSummaryCount,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            citizen_id: userId,
            start_date: fromDate,
            end_date: toDate,
          }),
        },
      }),
      transformResponse: (response: any) => {
        console.log('--- API: getBookingSummaryCount (POST /citizen/get_booking_summary_count) RAW RESPONSE ---', response);
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          console.log('--- API: getBookingSummaryCount PARSED DATA ---', data);
          if (Array.isArray(data) && data.length > 0) {
            return Number(data[0].total_puja_booking_summary_qty || data[0].total_booking_count || data[0].count || data.length);
          }
          if (typeof data === 'object' && data !== null) {
            return Number(data.total_puja_booking_summary_qty || data.total_booking_count || data.count || 0);
          }
          if (typeof data === 'number') {
            return data;
          }
        }
        return 0;
      },
    }),
    getAddressesCount: builder.query<number, { ctznId: number }>({
      query: ({ ctznId }) => ({
        url: ENDPOINTS.getAddressesCount,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({ ctzn_id: ctznId }),
        },
        headers: { 'Content-Type': 'application/json' },
      }),
      transformResponse: (response: any) => {
        console.log('--- API: getAddressesCount RESPONSE ---', response);
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          if (Array.isArray(data) && data.length > 0) {
            return data[0].total_address_count || data.length;
          }
          return typeof data === 'number' ? data : 0;
        }
        return 0;
      },
      providesTags: ['Addresses'],
    }),
    getCheckoutDetailsByOrderId: builder.query<any, { orderId: number; ctznId: number }>({
      query: ({ orderId, ctznId }) => {
        const enc_data = JSON.stringify({
          order_id: orderId,
          ctzn_id: ctznId,
        });
        console.log('--- API: getCheckoutDetailsByOrderId PAYLOAD ---', { enc_data });
        return {
          url: ENDPOINTS.getCheckoutDetailsByOrderId,
          method: 'POST',
          body: {
            enc_data,
          },
        };
      },
      transformResponse: (response: any) => {
        console.log('--- API: getCheckoutDetailsByOrderId RESPONSE ---', response);
        if (response && (response.status === 0 || response.status === '0')) {
          return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }
        return null;
      },
    }),
    getInvoiceDetails: builder.query<any, { order_id: number; booking_id: number }>({
      query: ({ order_id, booking_id }) => ({
        url: ENDPOINTS.getInvoiceDetails,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            order_id,
            booking_id,
          }),
        },
      }),
      transformResponse: (response: any) => {
        console.log('--- API: getInvoiceDetails RESPONSE ---', response);
        if (response && (response.status === 0 || response.status === '0')) {
          return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        }
        return null;
      },
    }),
  }),
});

export const {
  useGetPujaTagsQuery,
  useGetTagPujasQuery,
  useGetPujaImagesQuery,
  useGetPujaPackagesQuery,
  useLazyGetPujaPackagesQuery,
  useGetPackageMaterialsQuery,
  useGetPujaFullDetailsQuery,
  useAddPujaToCartMutation,
  useGetPujaCartInfoQuery,
  useGetPujaCartSummaryQuery,
  useManagePujaCartMutation,
  useSavePujaTagMutation,
  useSaveRelativeDetailsMutation,
  useDeleteRelativeDetailsMutation,
  useSaveUserProfileMutation,
  useSaveUserProfileImageMutation,
  useGetUserDetailsQuery,
  useSaveAddressMutation,
  useSaveAddressV1Mutation,
  useGetAddressesQuery,
  useSaveDefaultAddressMutation,
  useDeleteAddressMutation,
  useBookPujaMutation,
  useGetOrderSummaryQuery,
  useGetBookingSummaryQuery,
  useGetBookingDetailsQuery,
  useReschedulePujaMutation,
  useCancelPujaMutation,
  useGetAllPujaCountQuery,
  useGetOrderSummaryCountQuery,
  useGetBookingSummaryCountQuery,
  useGetGotraDetailsQuery,
  useGetStateDetailsQuery,
  useGetStatusTypeQuery,
  useGetAddressesCountQuery,
  useLazyGetCheckoutDetailsByOrderIdQuery,
  useLazyGetInvoiceDetailsQuery,
} = pujaApi;

export const uploadUserProfileImageDirectly = async (authId: number | string, file: any) => {
  const token = await getSystemToken();
  const formData = new FormData();
  const numId = Number(authId) || 0;
  const dataValue = `{"enc_data": "{\\"auth_id\\":${numId}}"}`;
  formData.append('data', dataValue);

  const fileObj = file
    ? {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || file.fileName || `profile_${numId}.jpg`,
    }
    : null;

  if (fileObj) {
    formData.append('file', fileObj as any);
  }

  console.log('==============================================');
  console.log('=== SAVE USER PROFILE IMAGE: FULL PAYLOAD ===');
  console.log('URL:', `${API_BASE_URL}${ENDPOINTS.saveUserProfileImage}`);
  console.log('data:', dataValue);
  console.log('file:', JSON.stringify(fileObj, null, 2));
  console.log('==============================================');

  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.saveUserProfileImage}`, {
    method: 'POST',
    headers: {
      'accept': '*/*',
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const json = await res.json();
  console.log('==============================================');
  console.log('=== SAVE USER PROFILE IMAGE: SERVER RESPONSE ===', JSON.stringify(json, null, 2));
  console.log('==============================================');
  return json;
};
