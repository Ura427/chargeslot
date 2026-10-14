import { configureStore } from '@reduxjs/toolkit';
import { api } from '../api/apiSlice';
import authReducer from '../features/auth/authSlice';

// A factory so tests can start each case from a clean store.
export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  });
}

export const store = makeStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
