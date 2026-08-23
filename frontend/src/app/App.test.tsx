import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { App } from './App';
import { store } from '@app/store';

vi.mock('@pages/home', () => ({
  HomePage: () => <div>home-page</div>,
}));

vi.mock('@pages/board', () => ({
  BoardPage: () => <div>board-page</div>,
}));

vi.mock('@app/providers/ToastManager', () => ({
  ToastManager: () => <div data-testid="toast-manager" />,
}));

const renderApp = (initialPath: string) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </Provider>,
  );

describe('App', () => {
  it('renders the HomePage on the root route', () => {
    renderApp('/');
    expect(screen.getByText('home-page')).toBeInTheDocument();
  });

  it('renders the BoardPage on the /board/:boardId route', () => {
    renderApp('/board/board-123');
    expect(screen.getByText('board-page')).toBeInTheDocument();
  });

  it('always renders the ToastManager', () => {
    renderApp('/');
    expect(screen.getByTestId('toast-manager')).toBeInTheDocument();
  });
});
