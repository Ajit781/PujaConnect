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
  const skipGlobal = extraOptions?.skipGlobalLoader;

  // Start global loader if not skipped
  if (!skipGlobal) {
    api.dispatch(showLoader());
  }

  const token = await getSystemToken();
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    const statusStr = result.error.status;
    const httpStatus = typeof statusStr === 'number' ? statusStr : undefined;
    const url = typeof args === 'string' ? args : args?.url;

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
      handleApiHttpError(httpStatus, url);
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
  tagTypes: ['Pujas', 'Tags', 'Cart'],
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
} = pujaApi;
