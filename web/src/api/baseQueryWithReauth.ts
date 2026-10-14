import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../app/store';
import { loggedOut, setCredentials } from '../features/auth/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  // Sends the httpOnly refresh-token cookie to the API on another origin.
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// A 401 from these means bad credentials or a dead session, not an expired access token.
const NO_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
];

// The refresh in flight, shared by every request that gets a 401 meanwhile.
// Refresh tokens rotate, so two parallel refreshes would make the second one look
// like a replayed token and revoke the whole session.
let refreshing: Promise<boolean> | null = null;

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = typeof args === 'string' ? args : args.url;
  if (result.error?.status !== 401 || NO_REFRESH.includes(url)) {
    return result;
  }

  refreshing ??= (async () => {
    const refresh = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions,
    );
    const accessToken = (refresh.data as { accessToken?: string } | undefined)
      ?.accessToken;
    if (accessToken) {
      api.dispatch(setCredentials({ accessToken }));
      return true;
    }
    // ProtectedRoute sends the user to /login once the token is gone.
    api.dispatch(loggedOut());
    return false;
  })().finally(() => {
    refreshing = null;
  });

  if (await refreshing) {
    result = await rawBaseQuery(args, api, extraOptions);
  }
  return result;
};
