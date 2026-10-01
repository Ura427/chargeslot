import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id?: string;
  email: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ accessToken: string; user?: AuthUser }>,
    ) {
      state.accessToken = action.payload.accessToken;
      if (action.payload.user) {
        state.user = action.payload.user;
      }
    },
    loggedOut(state) {
      state.accessToken = null;
      state.user = null;
    },
  },
});

export const { setCredentials, loggedOut } = authSlice.actions;
export default authSlice.reducer;
