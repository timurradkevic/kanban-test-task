import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@app/store';

interface UiState {
  openModalsCount: number;
}

const initialState: UiState = { openModalsCount: 0 };

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    modalOpened: (state) => {
      state.openModalsCount += 1;
    },
    modalClosed: (state) => {
      state.openModalsCount = Math.max(0, state.openModalsCount - 1);
    },
  },
});

export const { modalOpened, modalClosed } = uiSlice.actions;
export const selectIsAnyModalOpen = (state: RootState & { ui: UiState }) =>
  state.ui.openModalsCount > 0;
export const uiReducer = uiSlice.reducer;
