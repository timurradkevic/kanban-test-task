import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AddTaskButton } from './CreateTask';

const createTaskMock = vi.fn();
const unwrapMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('@entities/task', () => ({
  useCreateTaskMutation: () => [
    (...args: unknown[]) => {
      createTaskMock(...args);
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

const renderWithRouter = (columnId = 'col-1') =>
  render(
    <MemoryRouter initialEntries={['/board/b-1']}>
      <Routes>
        <Route
          path="/board/:boardId"
          element={<AddTaskButton columnId={columnId} />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('AddTaskButton', () => {
  beforeEach(() => {
    createTaskMock.mockClear();
    unwrapMock.mockReset();
    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();
  });

  it('renders the "Add Task" trigger button', () => {
    renderWithRouter();
    expect(screen.getByText('Add Task')).toBeInTheDocument();
  });

  it('does not show the form initially', () => {
    renderWithRouter();
    expect(screen.queryByText('New Task')).not.toBeInTheDocument();
  });

  it('opens the create-task form when the trigger button is clicked', async () => {
    renderWithRouter();
    await userEvent.click(screen.getByText('Add Task'));
    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('closes the form when the cancel button is clicked', async () => {
    renderWithRouter();
    await userEvent.click(screen.getByText('Add Task'));
    await userEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('New Task')).not.toBeInTheDocument();
  });

  it('submits the trimmed name and description and shows a success toast', async () => {
    unwrapMock.mockResolvedValue({ id: 't-new' });
    renderWithRouter('col-42');

    await userEvent.click(screen.getByText('Add Task'));
    const [nameInput, descriptionInput] = screen.getAllByRole('textbox');
    await userEvent.type(nameInput, '  New Task  ');
    await userEvent.type(descriptionInput, '  details  ');
    await userEvent.click(screen.getByText('Create'));

    expect(createTaskMock).toHaveBeenCalledWith({
      name: 'New Task',
      description: 'details',
      columnId: 'col-42',
    });
    expect(toastSuccessMock).toHaveBeenCalledWith('Task created successfully');
  });

  it('closes the form after a successful submission', async () => {
    unwrapMock.mockResolvedValue({ id: 't-new' });
    renderWithRouter();

    await userEvent.click(screen.getByText('Add Task'));
    await userEvent.type(screen.getAllByRole('textbox')[0], 'Task');
    await userEvent.click(screen.getByText('Create'));

    expect(screen.queryByText('New Task')).not.toBeInTheDocument();
  });

  it('shows an error toast and keeps the form open when creation fails', async () => {
    unwrapMock.mockRejectedValue(new Error('boom'));
    renderWithRouter();

    await userEvent.click(screen.getByText('Add Task'));
    await userEvent.type(screen.getAllByRole('textbox')[0], 'Task');
    await userEvent.click(screen.getByText('Create'));

    expect(toastErrorMock).toHaveBeenCalledWith('Failed to create task');
  });
});
