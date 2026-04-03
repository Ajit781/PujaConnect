import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL, ENDPOINTS } from '../../config/apiConfig';
import {
  PujaTag,
  PujaType,
  PujaImage,
  PujaPackage,
  PujaMaterial,
  PujaFullDetails,
  PujaCartItem,
  BookingSummary,
  BookingDetail,
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
  prepareHeaders: async headers => {
    // Priority 1: System token from AsyncStorage (used by existing logic)
    const token = await getSystemToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('accept', '*/*');
    headers.set('Content-Type', 'application/json');
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
      { userId: number; tagId: number; pageNo: number; limit: number }
    >({
      query: ({ userId, tagId, pageNo, limit }) => ({
        url: ENDPOINTS.getTagPujas,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            page_no: pageNo,
            limit,
            puja_tag_id: tagId,
            ctnz_id: userId,
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
      number | string
    >({
      query: userId => ({
        url: ENDPOINTS.getPujaCartSummary,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
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
          enc_data: JSON.stringify({ user_id: userId.toString() }),
        };
        return {
          url: ENDPOINTS.getUserDetails,
          method: 'POST',
          body: payload,
        };
      },
      transformResponse: (response: any) => {
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return data;
        }
        return null;
      },
      providesTags: ['UserDetails'],
    }),
    saveRelativeDetails: builder.mutation<
      { status: number; message: string; data: any },
      { data: string }
    >({
      query: ({ data }) => ({
        url: ENDPOINTS.saveRelativeDetails,
        method: 'POST',
        body: data,
        headers: { 'Content-Type': 'application/json' },
      }),
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
        console.log('--- API: saveUserProfile PAYLOAD ---', data);
        console.log('--- API: saveUserProfile FILE ---', file);
        if (file) {
          formData.append('file', file);
        } else {
          formData.append('file', {
            uri: 'file://empty',
            name: 'empty.txt',
            type: 'text/plain',
          });
        }
        return {
          url: ENDPOINTS.saveUserProfile,
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
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
      any[],
      {
        userId: string | number;
        relationTypeId?: number;
        pageNo: number;
        pageSize: number;
      }
    >({
      query: ({ userId, relationTypeId = 0, pageNo = 1, pageSize = 10 }) => {
        const payload = {
          enc_data: JSON.stringify({
            ctzn_id: userId.toString(),
            relation_type_id: relationTypeId.toString(),
            page_no: pageNo.toString(),
            page_size: pageSize.toString(),
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
        };
      },
      transformResponse: (response: any) => {
        console.log('--- API: getAddresses RESPONSE ---', response);
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return Array.isArray(data) ? data : [];
        }
        return [];
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
    getBookingSummary: builder.query<
      BookingSummary[],
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
            ctzn_id: userId,
            status,
            payment_status: paymentStatus,
            page_no: pageNo,
            page_size: pageSize,
            from_date: fromDate,
            to_date: toDate,
          }),
        },
      }),
      transformResponse: (response: any) => {
        console.log('--- API: getBookingSummary RESPONSE ---', response);
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
    getBookingDetails: builder.query<BookingDetail[], number | string>({
      query: bookingId => ({
        url: ENDPOINTS.getBookingDetails,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            booking_id: Number(bookingId),
          }),
        },
      }),
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
        ctznId: number | string;
        packageId: number | string;
        newDate: string; // YYYY-MM-DD
        newTime: string; // HH:mm
      }
    >({
      query: ({ bookingId, ctznId, packageId, newDate, newTime }) => ({
        url: ENDPOINTS.reschedulePuja,
        method: 'POST',
        body: {
          enc_data: JSON.stringify({
            booking_id: Number(bookingId),
            ctzn_id: Number(ctznId),
            package_id: Number(packageId),
            new_preferred_date: newDate,
            new_preferred_time: newTime,
          }),
        },
      }),
    }),
    cancelBooking: builder.mutation<
      any,
      {
        booking_id: number | string;
        package_id: number | string;
        reason: string;
        ctzn_id: number | string;
      }
    >({
      query: payload => ({
        url: ENDPOINTS.cancelBooking,
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
            ctzn_id: userId,
            status,
            payment_status: paymentStatus,
            from_date: fromDate,
            to_date: toDate,
          }),
        },
      }),
      transformResponse: (response: any) => {
        if (response && (response.status === 0 || response.status === '0')) {
          const data =
            typeof response.data === 'string'
              ? JSON.parse(response.data)
              : response.data;
          return data?.total_puja_booking_summary_qty || 0;
        }
        return 0;
      },
    }),
  }),
});

export const {
  useGetPujaTagsQuery,
  useGetTagPujasQuery,
  useGetPujaImagesQuery,
  useGetPujaPackagesQuery,
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
  useGetUserDetailsQuery,
  useSaveAddressMutation,
  useGetAddressesQuery,
  useSaveDefaultAddressMutation,
  useDeleteAddressMutation,
  useBookPujaMutation,
  useGetBookingSummaryQuery,
  useGetBookingDetailsQuery,
  useReschedulePujaMutation,
  useCancelBookingMutation,
  useGetAllPujaCountQuery,
  useGetBookingSummaryCountQuery,
} = pujaApi;
