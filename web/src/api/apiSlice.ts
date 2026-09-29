import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    // Sends the httpOnly refresh-token cookie to the API on another origin.
    credentials: 'include',
  }),
  endpoints: () => ({}),
});
