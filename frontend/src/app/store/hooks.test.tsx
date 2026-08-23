import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { uiReducer, modalOpened } from '@shared/model/uiSlice';
import { useAppDispatch, useAppSelector } from './hooks';

describe('store hooks', () => {
  const makeStore = () => configureStore({ reducer: { ui: uiReducer } });

  it('useAppSelector reads state from the redux store', () => {
    const store = makeStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(
      () => useAppSelector((state) => state.ui.openModalsCount),
      { wrapper },
    );

    expect(result.current).toBe(0);
  });

  it('useAppDispatch dispatches actions to the redux store', () => {
    const store = makeStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useAppDispatch(), { wrapper });
    result.current(modalOpened());

    expect(store.getState().ui.openModalsCount).toBe(1);
  });
});
