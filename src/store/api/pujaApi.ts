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
  tagTypes: ['Pujas', 'Tags', 'Cart', 'UserDetails'],
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
        if (file) {
          formData.append('file', file);
        }
        return {
          url: ENDPOINTS.saveUserProfile,
          method: 'POST',
          body: formData,
          // Content-Type is set automatically by browser/RN for FormData
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
      invalidatesTags: ['UserDetails'],
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
  useManagePujaCartMutation,
  useSavePujaTagMutation,
  useGetUserDetailsQuery,
  useSaveRelativeDetailsMutation,
  useDeleteRelativeDetailsMutation,
  useSaveUserProfileMutation,
} = pujaApi;
