import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ColumnCard } from './ColumnCard';
import type { Column } from '../model/types';

vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ setNodeRef: vi.fn() }),
}));

vi.mock('@features/create-task', () => ({
  AddTaskButton: ({ columnId }: { columnId: string }) => (
    <button>add-task-{columnId}</button>
  ),
}));

vi.mock('@entities/task', () => ({
  TaskItem: ({ name }: { name: string }) => <div>task-{name}</div>,
}));

const makeColumn = (overrides: Partial<Column> = {}): Column => ({
  id: 'col-1',
  name: 'To Do',
  order: 0,
  type: 'TODO',
  tasks: [],
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('ColumnCard', () => {
  it('renders the column name', () => {
    render(<ColumnCard column={makeColumn()} />);
    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  it('renders the empty state message when there are no tasks', () => {
    render(<ColumnCard column={makeColumn({ tasks: [] })} />);
    expect(screen.getByText('No tasks in this column')).toBeInTheDocument();
  });

  it('renders a TaskItem for each task in the column', () => {
    const tasks = [
      {
        id: 't-1',
        name: 'First',
        description: null,
        order: 0,
        columnId: 'col-1',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 't-2',
        name: 'Second',
        description: null,
        order: 1,
        columnId: 'col-1',
        createdAt: '',
        updatedAt: '',
      },
    ];
    render(<ColumnCard column={makeColumn({ tasks })} />);

    expect(screen.getByText('task-First')).toBeInTheDocument();
    expect(screen.getByText('task-Second')).toBeInTheDocument();
    expect(
      screen.queryByText('No tasks in this column'),
    ).not.toBeInTheDocument();
  });

  it('renders the AddTaskButton for the column', () => {
    render(<ColumnCard column={makeColumn({ id: 'col-42' })} />);
    expect(screen.getByText('add-task-col-42')).toBeInTheDocument();
  });

  it('applies the drop-target highlight styling when isDropTarget is true', () => {
    const { container } = render(
      <ColumnCard column={makeColumn()} isDropTarget />,
    );
    expect(container.firstChild).toHaveClass('bg-blue-100');
  });

  it('does not apply the drop-target highlight styling by default', () => {
    const { container } = render(<ColumnCard column={makeColumn()} />);
    expect(container.firstChild).not.toHaveClass('bg-blue-100');
  });
});
