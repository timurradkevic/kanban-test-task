import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotFound } from './NotFound';

describe('NotFound', () => {
  it('renders the status code and title', () => {
    render(
      <NotFound
        title="Board not found"
        code={404}
        navigate={vi.fn()}
        refetch={vi.fn()}
      />,
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Board not found')).toBeInTheDocument();
  });

  it('renders a different code and title', () => {
    render(
      <NotFound
        title="Error loading board"
        code={500}
        navigate={vi.fn()}
        refetch={vi.fn()}
      />,
    );

    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Error loading board')).toBeInTheDocument();
  });

  it('navigates home when the back button is clicked', async () => {
    const navigate = vi.fn();
    render(
      <NotFound
        title="Not found"
        code={404}
        navigate={navigate}
        refetch={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[0]);

    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('calls refetch when the reload button is clicked', async () => {
    const refetch = vi.fn();
    render(
      <NotFound
        title="Not found"
        code={404}
        navigate={vi.fn()}
        refetch={refetch}
      />,
    );

    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[1]);

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
