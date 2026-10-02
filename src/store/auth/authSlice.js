import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accessToken: "",
  refreshToken: "",
  user: null,
  permissions: [],
  role: null,
};

const authSlice = createSlice({
  name: "authSlice",
  initialState,
  reducers: {
    saveLoginUserData(state, action) {
      state.user = action?.payload?.user;
      state.accessToken = action?.payload?.token;
      state.refreshToken = action?.payload?.refreshToken;
      state.role = action?.payload?.user?.role || null;
      state.permissions = action?.payload?.user?.permissions || [];
    },

    updateUser(state, action) {
      state.user = action.payload;
      state.role = action?.payload?.role || state.role;
      state.permissions = action?.payload?.permissions || state.permissions;
    },
    updatePermissions(state, action) {
      state.permissions = action.payload;
    },
    updateRole(state, action) {
      state.role = action.payload;
    },
    signOutRequest(state) {
      state.accessToken = "";
      state.refreshToken = "";
      state.user = null;
      state.permissions = [];
      state.role = null;
    },
    updateJWTTokens: (state, action) => {
      state.accessToken = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
    },
  },
});

export const {
  saveLoginUserData,
  signOutRequest,
  updateUser,
  updatePermissions,
  updateRole,
  updateJWTTokens,
} = authSlice.actions;

export default authSlice.reducer;
