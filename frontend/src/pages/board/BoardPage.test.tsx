import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BoardPage } from './BoardPage';

const boardIdSpy = vi.fn();

vi.mock('@widgets/board', () => ({
  Board: ({ boardId }: { boardId: string | undefined }) => {
    boardIdSpy(boardId);
    return <div>board-widget-{boardId}</div>;
  },
}));

describe('BoardPage', () => {
  it('renders the Board widget with the boardId from the URL', () => {
    render(
      <MemoryRouter initialEntries={['/board/abc-123']}>
        <Routes>
          <Route path="/board/:boardId" element={<BoardPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('board-widget-abc-123')).toBeInTheDocument();
    expect(boardIdSpy).toHaveBeenCalledWith('abc-123');
  });
});
