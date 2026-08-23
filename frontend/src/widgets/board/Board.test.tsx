import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import type React from 'react';
import { Board } from './Board';
import { handleDragEnd } from '@/features/move-task';

const navigateMock = vi.fn();
const refetchMock = vi.fn();
const moveTaskMock = vi.fn();

let queryResult: {
  data: unknown;
  error: unknown;
  isLoading: boolean;
  refetch: () => void;
};

vi.mock('@entities/board', () => ({
  useGetBoardQuery: () => queryResult,
  useUpdateBoardMutation: () => [vi.fn(), { isLoading: false }],
}));

vi.mock('@entities/task', () => ({
  useMoveTaskMutation: () => [moveTaskMock, { isLoading: false }],
  TaskItemPreview: ({ name }: { name: string }) => <div>preview-{name}</div>,
}));

vi.mock('@shared/ui/Buttons', () => ({
  BackButton: () => <button>Back</button>,
  CopyButton: ({ textToCopy }: { textToCopy: string }) => (
    <button>{textToCopy}</button>
  ),
  UpdateButton: ({ onClick }: { onClick?: () => void }) => (
    <button onClick={onClick}>Update</button>
  ),
}));

vi.mock('@features/update-board', () => ({
  BoardName: ({ board }: { board: { name: string } }) => (
    <div>board-name-{board.name}</div>
  ),
}));

vi.mock('@features/delete-board', () => ({
  DeleteBoardButton: ({ boardId }: { boardId: string }) => (
    <button>delete-{boardId}</button>
  ),
}));

vi.mock('@entities/column', () => ({
  ColumnCard: ({
    column,
    isDropTarget,
  }: {
    column: { id: string; name: string };
    isDropTarget?: boolean;
  }) => (
    <div>
      column-{column.name}-{isDropTarget ? 'drop-target' : 'not-drop-target'}
    </div>
  ),
}));

vi.mock('@widgets/notFound', () => ({
  NotFound: ({ title, code }: { title: string; code: number }) => (
    <div>
      not-found-{code}-{title}
    </div>
  ),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@app/store/hooks', () => ({
  useAppSelector: () => false,
}));

vi.mock('@shared/model', () => ({
  selectIsAnyModalOpen: vi.fn(),
}));

let capturedDndProps: {
  onDragStart?: (e: unknown) => void;
  onDragOver?: (e: unknown) => void;
  onDragEnd?: (e: unknown) => void;
  onDragCancel?: () => void;
} = {};

vi.mock('@dnd-kit/core', async () => {
  const actual =
    await vi.importActual<typeof import('@dnd-kit/core')>('@dnd-kit/core');
  return {
    ...actual,
    useSensor: vi.fn(),
    useSensors: vi.fn(() => []),
    DndContext: ({
      children,
      onDragStart,
      onDragOver,
      onDragEnd,
      onDragCancel,
    }: {
      children: React.ReactNode;
      onDragStart?: (e: unknown) => void;
      onDragOver?: (e: unknown) => void;
      onDragEnd?: (e: unknown) => void;
      onDragCancel?: () => void;
    }) => {
      capturedDndProps = { onDragStart, onDragOver, onDragEnd, onDragCancel };
      return <div>{children}</div>;
    },
    DragOverlay: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="drag-overlay">{children}</div>
    ),
  };
});

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock('@/features/move-task', () => ({
  handleDragEnd: vi.fn(),
  resolveColumnId: (overId: string | undefined) =>
    overId === 'c-1' ? 'c-1' : overId === 'c-2' ? 'c-2' : undefined,
}));

describe('Board', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    refetchMock.mockClear();
    moveTaskMock.mockClear();
    queryResult = {
      data: undefined,
      error: undefined,
      isLoading: false,
      refetch: refetchMock,
    };
  });

  it('renders a loading skeleton while the board is loading', () => {
    queryResult.isLoading = true;
    const { container } = render(<Board boardId="b-1" />);

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    );
  });

  it('renders a 404 NotFound when the board does not exist', () => {
    queryResult.error = { status: 404, data: { message: 'not found' } };
    render(<Board boardId="missing" />);

    expect(
      screen.getByText('not-found-404-Board not found'),
    ).toBeInTheDocument();
  });

  it('renders a generic error NotFound for non-404 errors', () => {
    queryResult.error = { status: 500, data: { message: 'server error' } };
    render(<Board boardId="b-1" />);

    expect(
      screen.getByText('not-found-500-Error loading board'),
    ).toBeInTheDocument();
  });

  it('renders a 404 NotFound when there is no boardId', () => {
    render(<Board boardId={undefined} />);

    expect(
      screen.getByText('not-found-404-Board not found'),
    ).toBeInTheDocument();
  });

  it('renders the board name, id and columns on success', () => {
    queryResult.data = {
      id: 'board-id-1234567890',
      name: 'My Kanban Board',
      columns: [
        { id: 'c-1', name: 'Todo', order: 0, type: 'TODO', tasks: [] },
        { id: 'c-2', name: 'Done', order: 1, type: 'DONE', tasks: [] },
      ],
    };
    render(<Board boardId="board-id-1234567890" />);

    expect(screen.getByText('board-name-My Kanban Board')).toBeInTheDocument();
    expect(screen.getByText('column-Todo-not-drop-target')).toBeInTheDocument();
    expect(screen.getByText('column-Done-not-drop-target')).toBeInTheDocument();
  });

  it('truncates the displayed board id to 12 characters followed by an ellipsis', () => {
    queryResult.data = {
      id: 'board-id-1234567890',
      name: 'Board',
      columns: [],
    };
    render(<Board boardId="board-id-1234567890" />);

    expect(screen.getByText('board-id-123...')).toBeInTheDocument();
  });

  it('renders no columns when the board has none', () => {
    queryResult.data = { id: 'b-1', name: 'Empty Board', columns: [] };
    render(<Board boardId="b-1" />);

    expect(screen.getByText('board-name-Empty Board')).toBeInTheDocument();
    expect(screen.queryByText(/^column-/)).not.toBeInTheDocument();
  });

  it('shows a TaskItemPreview in the drag overlay once a drag starts', () => {
    queryResult.data = {
      id: 'b-1',
      name: 'Board',
      columns: [
        {
          id: 'c-1',
          name: 'Todo',
          order: 0,
          type: 'TODO',
          tasks: [
            {
              id: 't-1',
              name: 'Dragged task',
              description: null,
              order: 0,
              columnId: 'c-1',
            },
          ],
        },
      ],
    };
    render(<Board boardId="b-1" />);

    expect(screen.getByTestId('drag-overlay')).toBeEmptyDOMElement();

    act(() => {
      capturedDndProps.onDragStart?.({ active: { id: 't-1' } });
    });

    expect(screen.getByText('preview-Dragged task')).toBeInTheDocument();
  });

  it('clears the drag overlay preview on drag cancel', () => {
    queryResult.data = {
      id: 'b-1',
      name: 'Board',
      columns: [
        {
          id: 'c-1',
          name: 'Todo',
          order: 0,
          type: 'TODO',
          tasks: [
            {
              id: 't-1',
              name: 'Dragged task',
              description: null,
              order: 0,
              columnId: 'c-1',
            },
          ],
        },
      ],
    };
    render(<Board boardId="b-1" />);

    act(() => {
      capturedDndProps.onDragStart?.({ active: { id: 't-1' } });
    });
    expect(screen.getByText('preview-Dragged task')).toBeInTheDocument();

    act(() => {
      capturedDndProps.onDragCancel?.();
    });

    expect(screen.queryByText('preview-Dragged task')).not.toBeInTheDocument();
  });

  it('calls handleDragEnd with the board id and columns when a drag ends', () => {
    const columns = [
      { id: 'c-1', name: 'Todo', order: 0, type: 'TODO', tasks: [] },
    ];
    queryResult.data = { id: 'b-1', name: 'Board', columns };
    render(<Board boardId="b-1" />);

    const event = { active: { id: 't-1' }, over: { id: 'c-1' } };
    act(() => {
      capturedDndProps.onDragEnd?.(event);
    });

    expect(handleDragEnd).toHaveBeenCalledWith(
      event,
      'b-1',
      columns,
      moveTaskMock,
    );
  });

  it('marks the target column as a drop target while dragging over it', () => {
    const columns = [
      { id: 'c-1', name: 'Todo', order: 0, type: 'TODO', tasks: [] },
      { id: 'c-2', name: 'Done', order: 1, type: 'DONE', tasks: [] },
    ];
    queryResult.data = { id: 'b-1', name: 'Board', columns };
    render(<Board boardId="b-1" />);

    expect(screen.getByText('column-Todo-not-drop-target')).toBeInTheDocument();

    act(() => {
      capturedDndProps.onDragOver?.({ over: { id: 'c-1' } });
    });

    expect(screen.getByText('column-Todo-drop-target')).toBeInTheDocument();
    expect(screen.getByText('column-Done-not-drop-target')).toBeInTheDocument();
  });

  it('clears the drop-target highlight once the drag ends', () => {
    const columns = [
      { id: 'c-1', name: 'Todo', order: 0, type: 'TODO', tasks: [] },
    ];
    queryResult.data = { id: 'b-1', name: 'Board', columns };
    render(<Board boardId="b-1" />);

    act(() => {
      capturedDndProps.onDragOver?.({ over: { id: 'c-1' } });
    });
    expect(screen.getByText('column-Todo-drop-target')).toBeInTheDocument();

    act(() => {
      capturedDndProps.onDragCancel?.();
    });

    expect(screen.getByText('column-Todo-not-drop-target')).toBeInTheDocument();
  });

  it('resets the drag state after a drag ends', () => {
    queryResult.data = {
      id: 'b-1',
      name: 'Board',
      columns: [
        {
          id: 'c-1',
          name: 'Todo',
          order: 0,
          type: 'TODO',
          tasks: [
            {
              id: 't-1',
              name: 'Dragged task',
              description: null,
              order: 0,
              columnId: 'c-1',
            },
          ],
        },
      ],
    };
    render(<Board boardId="b-1" />);

    act(() => {
      capturedDndProps.onDragStart?.({ active: { id: 't-1' } });
    });
    expect(screen.getByText('preview-Dragged task')).toBeInTheDocument();

    act(() => {
      capturedDndProps.onDragEnd?.({
        active: { id: 't-1' },
        over: { id: 'c-1' },
      });
    });

    expect(screen.queryByText('preview-Dragged task')).not.toBeInTheDocument();
  });
});
