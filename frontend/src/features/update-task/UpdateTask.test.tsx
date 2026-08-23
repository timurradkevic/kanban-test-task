import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UpdateTaskButton } from './UpdateTask';
import type { Task } from '@entities/task';

const updateTaskMock = vi.fn();
const unwrapMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('@entities/task', () => ({
  useUpdateTaskMutation: () => [
    (...args: unknown[]) => {
      updateTaskMock(...args);
      return { unwrap: unwrapMock };
    },
  ],
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock('@shared/lib', () => ({
  useModalLock: vi.fn(),
}));

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't-1',
  name: 'Original name',
  description: 'Original description',
  order: 0,
  columnId: 'c-1',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const renderWithRouter = (task: Task) =>
  render(
    <MemoryRouter initialEntries={['/board/b-1']}>
      <Routes>
        <Route
          path="/board/:boardId"
          element={<UpdateTaskButton task={task} />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('UpdateTaskButton', () => {
  beforeEach(() => {
    updateTaskMock.mockClear();
    unwrapMock.mockReset();
    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();
  });

  it('does not show the form initially', () => {
    renderWithRouter(makeTask());
    expect(screen.queryByText('Update Task')).not.toBeInTheDocument();
  });

  it('opens the update form pre-filled with the task data when clicked', async () => {
    renderWithRouter(makeTask({ name: 'Existing', description: 'Old desc' }));

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Update Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old desc')).toBeInTheDocument();
  });

  it('falls back to an empty description field when the task has none', async () => {
    renderWithRouter(makeTask({ description: null }));

    await userEvent.click(screen.getByRole('button'));

    const [, descriptionInput] = screen.getAllByRole('textbox');
    expect(descriptionInput).toHaveValue('');
  });

  it('closes the form when cancel is clicked', async () => {
    renderWithRouter(makeTask());

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Update Task')).not.toBeInTheDocument();
  });

  it('submits the trimmed updated name and description, and shows a success toast', async () => {
    unwrapMock.mockResolvedValue({ id: 't-1' });
    renderWithRouter(makeTask({ id: 't-1', columnId: 'c-9' }));

    await userEvent.click(screen.getByRole('button'));
    const [nameInput, descriptionInput] = screen.getAllByRole('textbox');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, '  Updated name  ');
    await userEvent.clear(descriptionInput);
    await userEvent.type(descriptionInput, '  new desc  ');
    await userEvent.click(screen.getByText('Update'));

    expect(updateTaskMock).toHaveBeenCalledWith({
      taskId: 't-1',
      name: 'Updated name',
      description: 'new desc',
      columnId: 'c-9',
    });
    expect(toastSuccessMock).toHaveBeenCalledWith('Task updated successfully');
  });

  it('shows an error toast when the update fails', async () => {
    unwrapMock.mockRejectedValue(new Error('boom'));
    renderWithRouter(makeTask());

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText('Update'));

    expect(toastErrorMock).toHaveBeenCalledWith('Failed to update task');
  });
});
