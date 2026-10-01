import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../app/store';

// ---------------------------------------------------------------------------
// USER-REWRITE FILE (see .claude/plans/chargeslot-showcase.md, "The 4 files").
//
// This is a plain base query that attaches the access token and nothing else.
// It does NOT implement 401 -> refresh -> retry. Every 401 from the API is
// currently surfaced to the caller as-is; nothing here logs the user out or
// refreshes automatically on token expiry.
//
// TODO(user): rewrite this to wrap the query below with reauth logic:
//   - on a 401 response, call POST /auth/refresh once
//   - use a mutex so concurrent 401s share a single in-flight refresh
//   - retry the original request with the new access token
//   - if the refresh itself fails, dispatch `loggedOut()` and let the app
//     redirect to /login
// ---------------------------------------------------------------------------
export const baseQueryWithReauth = fetchBaseQuery({
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
