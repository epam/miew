import { createSlice } from '@reduxjs/toolkit';

const infoSlice = createSlice({
  name: 'info',
  initialState: {},
  reducers: {
    updateLoadingStage: (state, action) => {
      state.loadingStage = action.payload;
    },
    changeTheme: (state, action) => {
      state.theme = action.payload;
    },
  },
});

export const { updateLoadingStage, changeTheme } = infoSlice.actions;

export default infoSlice.reducer;
