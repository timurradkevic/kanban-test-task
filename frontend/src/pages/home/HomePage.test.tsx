import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { HomePage } from './HomePage';
import { store } from '@app/store';

const navigateMock = vi.fn();
const createBoardMock = vi.fn();
const unwrapMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@entities/board', () => ({
  useCreateBoardMutation: () => [
    (...args: unknown[]) => {
      createBoardMock(...args);
      return { unwrap: unwrapMock };
    },
    { isLoading: false },
  ],
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

const renderHomePage = () =>
  render(
    <Provider store={store}>
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    </Provider>,
  );

describe('HomePage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    createBoardMock.mockClear();
    unwrapMock.mockReset();
    toastErrorMock.mockClear();
  });

  it('renders without crashing', () => {
    renderHomePage();

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('renders the Board ID and board creation controls', () => {
    renderHomePage();

    expect(screen.getByPlaceholderText('Enter Board ID')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter New Board Name'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Go to board' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Board' }),
    ).toBeInTheDocument();
  });

  it('navigates to the board page when a board id is entered and submitted', async () => {
    renderHomePage();

    await userEvent.type(
      screen.getByPlaceholderText('Enter Board ID'),
      '  board-42  ',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Go to board' }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/board/board-42');
    });
  });

  it('shows an error toast and does not navigate when the board id is empty', async () => {
    renderHomePage();

    await userEvent.click(screen.getByRole('button', { name: 'Go to board' }));

    expect(toastErrorMock).toHaveBeenCalledWith('Board ID cannot be empty');
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('creates a board with the trimmed name and navigates to it on success', async () => {
    unwrapMock.mockResolvedValue({ id: 'new-board-id' });
    renderHomePage();

    await userEvent.type(
      screen.getByPlaceholderText('Enter New Board Name'),
      '  My Board  ',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Create Board' }));

    await waitFor(() => {
      expect(createBoardMock).toHaveBeenCalledWith({ name: 'My Board' });
      expect(navigateMock).toHaveBeenCalledWith('/board/new-board-id');
    });
  });

  it('shows an error toast and does not create a board when the name is empty', async () => {
    renderHomePage();

    await userEvent.click(screen.getByRole('button', { name: 'Create Board' }));

    expect(toastErrorMock).toHaveBeenCalledWith('Board name cannot be empty');
    expect(createBoardMock).not.toHaveBeenCalled();
  });

  it('shows an error toast when board creation fails', async () => {
    unwrapMock.mockRejectedValue(new Error('boom'));
    renderHomePage();

    await userEvent.type(
      screen.getByPlaceholderText('Enter New Board Name'),
      'My Board',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Create Board' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Failed to create board');
    });
  });
});
