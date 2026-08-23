import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReloadButton, BackButton, CopyButton } from './Buttons';

const toastSuccessMock = vi.fn();

vi.mock('react-hot-toast', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe('ReloadButton', () => {
  it('calls refetch when clicked', async () => {
    const refetch = vi.fn();
    render(<ReloadButton refetch={refetch} />);

    await userEvent.click(screen.getByRole('button'));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

describe('BackButton', () => {
  it('navigates to "/" when clicked', async () => {
    const navigate = vi.fn();
    render(<BackButton navigate={navigate} />);

    await userEvent.click(screen.getByRole('button'));

    expect(navigate).toHaveBeenCalledWith('/');
  });
});

describe('CopyButton', () => {
  beforeEach(() => {
    toastSuccessMock.mockClear();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('copies textToCopy to the clipboard when clicked', async () => {
    render(<CopyButton textToCopy="abc-123" textLabel="Board ID" />);

    await userEvent.click(screen.getByRole('button'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('abc-123');
  });

  it('shows a success toast with the provided label when clicked', async () => {
    render(<CopyButton textToCopy="abc-123" textLabel="Board ID" />);

    await userEvent.click(screen.getByRole('button'));

    expect(toastSuccessMock).toHaveBeenCalledWith(
      'Board ID copied to clipboard',
    );
  });
});
