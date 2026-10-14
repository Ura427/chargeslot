import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id?: string;
  email: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  // False until the startup refresh attempt (restoreSession) has finished.
  sessionChecked: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  sessionChecked: false,
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
      state.sessionChecked = true;
      if (action.payload.user) {
        state.user = action.payload.user;
      }
    },
    loggedOut(state) {
      state.accessToken = null;
      state.user = null;
      state.sessionChecked = true;
    },
  },
});

export const { setCredentials, loggedOut } = authSlice.actions;
export default authSlice.reducer;
