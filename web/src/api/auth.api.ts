import { api } from './apiSlice';
import type { makeStore } from '../app/store';
import { loggedOut, setCredentials } from '../features/auth/authSlice';

interface Credentials {
  email: string;
  password: string;
}

interface RegisterResponse {
  id: string;
  email: string;
}

interface LoginResponse {
  accessToken: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<RegisterResponse, Credentials>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation<LoginResponse, Credentials>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    refresh: builder.mutation<LoginResponse, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),
    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useLogoutMutation } =
  authApi;

// Called once at startup: the access token lives only in memory, but the httpOnly
// refresh cookie survives a reload, so one refresh restores the session.
export async function restoreSession(store: ReturnType<typeof makeStore>) {
  try {
    const { accessToken } = await store
      .dispatch(authApi.endpoints.refresh.initiate())
      .unwrap();
    store.dispatch(setCredentials({ accessToken }));
  } catch {
    store.dispatch(loggedOut());
  }
}
