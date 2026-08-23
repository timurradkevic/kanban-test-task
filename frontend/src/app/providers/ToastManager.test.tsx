import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ToastManager } from './ToastManager';

const dismissMock = vi.fn();
let toasts: { id: string; visible: boolean; createdAt: number }[] = [];

vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { dismiss: (...args: unknown[]) => dismissMock(...args) },
  Toaster: ({ position }: { position: string }) => (
    <div data-testid="toaster" data-position={position} />
  ),
  useToasterStore: () => ({ toasts }),
}));

describe('ToastManager', () => {
  beforeEach(() => {
    dismissMock.mockClear();
    toasts = [];
  });

  it('renders the Toaster at the bottom-center position', () => {
    const { getByTestId } = render(<ToastManager />);
    expect(getByTestId('toaster')).toHaveAttribute(
      'data-position',
      'bottom-center',
    );
  });

  it('does not dismiss anything when there are 5 or fewer visible toasts', () => {
    toasts = Array.from({ length: 5 }, (_, i) => ({
      id: `t${i}`,
      visible: true,
      createdAt: i,
    }));

    render(<ToastManager />);

    expect(dismissMock).not.toHaveBeenCalled();
  });

  it('dismisses the oldest toasts beyond the 5 most recent visible ones', () => {
    toasts = Array.from({ length: 7 }, (_, i) => ({
      id: `t${i}`,
      visible: true,
      createdAt: i,
    }));

    render(<ToastManager />);

    // Toasts are sorted newest first, so the 2 oldest (t0, t1) get dismissed.
    expect(dismissMock).toHaveBeenCalledTimes(2);
    expect(dismissMock).toHaveBeenCalledWith('t0');
    expect(dismissMock).toHaveBeenCalledWith('t1');
  });

  it('ignores toasts that are not visible', () => {
    toasts = [
      { id: 'hidden-1', visible: false, createdAt: 0 },
      { id: 'hidden-2', visible: false, createdAt: 1 },
    ];

    render(<ToastManager />);

    expect(dismissMock).not.toHaveBeenCalled();
  });
});
