import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteTaskButton } from './DeleteTask';

const deleteTaskMock = vi.fn();
const unwrapMock = vi.fn();
let isLoading = false;
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const toastMock = vi.fn();

vi.mock('@/entities/task', () => ({
  useDeleteTaskMutation: () => [
    (...args: unknown[]) => {
      deleteTaskMock(...args);
      return { unwrap: unwrapMock };
    },
    { isLoading },
  ],
}));

vi.mock('react-hot-toast', () => {
  const fn = (...args: unknown[]) => toastMock(...args);
  fn.success = (...args: unknown[]) => toastSuccessMock(...args);
  fn.error = (...args: unknown[]) => toastErrorMock(...args);
  return { default: fn };
});

vi.mock('@/shared/lib', () => ({
  useModalLock: vi.fn(),
}));

describe('DeleteTaskButton', () => {
  beforeEach(() => {
    deleteTaskMock.mockClear();
    unwrapMock.mockReset();
    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();
    toastMock.mockClear();
    isLoading = false;
  });

  it('does not show the confirmation dialog initially', () => {
    render(<DeleteTaskButton taskId="t-1" columnId="c-1" />);
    expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
  });

  it('shows the confirmation dialog when the delete button is clicked', async () => {
    render(<DeleteTaskButton taskId="t-1" columnId="c-1" />);

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
  });

  it('closes the dialog and shows an info toast when cancel is clicked', async () => {
    render(<DeleteTaskButton taskId="t-1" columnId="c-1" />);

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
    expect(toastMock).toHaveBeenCalledWith('Task deletion canceled');
  });

  it('deletes the task and shows a success toast when confirmed', async () => {
    unwrapMock.mockResolvedValue(undefined);
    render(<DeleteTaskButton taskId="t-1" columnId="c-1" />);

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText('Delete'));

    expect(deleteTaskMock).toHaveBeenCalledWith({
      taskId: 't-1',
      columnId: 'c-1',
    });
    expect(toastSuccessMock).toHaveBeenCalledWith('Task deleted successfully');
  });

  it('closes the dialog after a successful deletion', async () => {
    unwrapMock.mockResolvedValue(undefined);
    render(<DeleteTaskButton taskId="t-1" columnId="c-1" />);

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText('Delete'));

    expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
  });

  it('shows an error toast and keeps working when deletion fails', async () => {
    unwrapMock.mockRejectedValue(new Error('boom'));
    render(<DeleteTaskButton taskId="t-1" columnId="c-1" />);

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText('Delete'));

    expect(toastErrorMock).toHaveBeenCalledWith('Failed to delete task');
  });

  it('disables the trigger button while the deletion is in flight', () => {
    isLoading = true;
    render(<DeleteTaskButton taskId="t-1" columnId="c-1" />);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
