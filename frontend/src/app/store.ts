import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '@shared/api/api';
import { setupListeners } from '@reduxjs/toolkit/query';
import { uiReducer } from '@shared/model';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
