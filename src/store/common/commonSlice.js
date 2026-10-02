import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  example: "",
};

const commonSlice = createSlice({
  name: "commonSlice",
  initialState,
  reducers: {
    setExample: (state, action) => {
      state.example = action.payload;
    },
  },
});

export const { setExample } = commonSlice.actions;

export default commonSlice.reducer;
