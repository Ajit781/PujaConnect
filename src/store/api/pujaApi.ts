import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL, ENDPOINTS } from '../../config/apiConfig';
import { PujaTag, PujaType } from '../../service/api/dashboardService';
import { getSystemToken } from '../../service/api/tokenService';

export const pujaApi = createApi({
  reducerPath: 'pujaApi',
  baseQuery: fetchBaseQuery({
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
  }),
  tagTypes: ['Pujas', 'Tags'],
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
  }),
});

export const { useGetPujaTagsQuery, useGetTagPujasQuery } = pujaApi;
