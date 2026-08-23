import { describe, it, expect } from 'vitest';
import { store } from './store';
import { baseApi } from '@shared/api/api';
import { modalOpened } from '@shared/model/uiSlice';

describe('store', () => {
  it('includes the api reducer under its reducer path', () => {
    const state = store.getState();
    expect(state).toHaveProperty(baseApi.reducerPath);
  });

  it('includes the ui reducer with the initial state', () => {
    const state = store.getState();
    expect(state.ui).toEqual({ openModalsCount: 0 });
  });

  it('updates state when a ui action is dispatched', () => {
    store.dispatch(modalOpened());
    expect(store.getState().ui.openModalsCount).toBe(1);
  });
});
