import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useModalLock } from './useModalLock';
import { modalOpened, modalClosed } from '@shared/model/uiSlice';

const dispatchMock = vi.fn();

vi.mock('@app/store/hooks', () => ({
  useAppDispatch: () => dispatchMock,
}));

describe('useModalLock', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
  });

  it('does not dispatch anything when isOpen is false', () => {
    renderHook(() => useModalLock(false));
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('dispatches modalOpened when isOpen becomes true', () => {
    renderHook(() => useModalLock(true));
    expect(dispatchMock).toHaveBeenCalledWith(modalOpened());
  });

  it('dispatches modalClosed on unmount after being open', () => {
    const { unmount } = renderHook(() => useModalLock(true));
    dispatchMock.mockClear();

    unmount();

    expect(dispatchMock).toHaveBeenCalledWith(modalClosed());
  });

  it('dispatches modalClosed then modalOpened again when toggled from true to false to true', () => {
    const { rerender } = renderHook(({ isOpen }) => useModalLock(isOpen), {
      initialProps: { isOpen: true },
    });
    dispatchMock.mockClear();

    rerender({ isOpen: false });
    expect(dispatchMock).toHaveBeenCalledWith(modalClosed());

    dispatchMock.mockClear();
    rerender({ isOpen: true });
    expect(dispatchMock).toHaveBeenCalledWith(modalOpened());
  });

  it('does not dispatch modalClosed on unmount when it was never opened', () => {
    const { unmount } = renderHook(() => useModalLock(false));
    dispatchMock.mockClear();

    unmount();

    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
