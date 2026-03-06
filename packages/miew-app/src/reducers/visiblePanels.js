import { createSlice } from '@reduxjs/toolkit';

const visiblePanelsSlice = createSlice({
  name: 'visiblePanels',
  initialState: {},
  reducers: {
    showNav: (state) => {
      state.isPanelListVisible = !state.isPanelListVisible;
    },
    showTerminal: (state) => {
      state.isTerminalVisible = !state.isTerminalVisible;
    },
    showDisplayMode: (state) => {
      state.isDisplayModeVisible = !state.isDisplayModeVisible;
    },
    showDisplayColor: (state) => {
      state.isDisplayColorVisible = !state.isDisplayColorVisible;
    },
  },
});

export const {
  showNav,
  showTerminal,
  showDisplayMode,
  showDisplayColor,
} = visiblePanelsSlice.actions;

export default visiblePanelsSlice.reducer;
