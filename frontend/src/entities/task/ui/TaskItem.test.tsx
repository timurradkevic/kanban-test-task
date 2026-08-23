import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem } from './TaskItem';
import type { Task } from '../model/types';

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

vi.mock('@/features/update-task', () => ({
  UpdateTaskButton: () => <button>update-task-btn</button>,
}));

vi.mock('@/features/delete-task', () => ({
  DeleteTaskButton: () => <button>delete-task-btn</button>,
}));

vi.mock('@shared/lib', () => ({
  useModalLock: vi.fn(),
}));

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't-1',
  name: 'Write tests',
  description: null,
  order: 0,
  columnId: 'c-1',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('TaskItem', () => {
  it('renders the task name', () => {
    render(<TaskItem {...makeTask()} />);
    expect(screen.getByText('Write tests')).toBeInTheDocument();
  });

  it('renders the update and delete action buttons', () => {
    render(<TaskItem {...makeTask()} />);
    expect(screen.getByText('update-task-btn')).toBeInTheDocument();
    expect(screen.getByText('delete-task-btn')).toBeInTheDocument();
  });

  it('renders a truncated description when it is longer than 100 characters', () => {
    const longDescription = 'x'.repeat(150);
    render(<TaskItem {...makeTask({ description: longDescription })} />);
    expect(screen.getByText(`${'x'.repeat(100)}...`)).toBeInTheDocument();
  });

  it('does not render a description block when description is null', () => {
    render(<TaskItem {...makeTask({ description: null })} />);
    expect(screen.queryByText(/No description/)).not.toBeInTheDocument();
  });

  it('opens the task details modal when the content area is clicked', async () => {
    render(<TaskItem {...makeTask({ description: 'Some details' })} />);

    await userEvent.click(screen.getByText('Write tests'));

    expect(screen.getByText('Task Details')).toBeInTheDocument();
    // The details modal shows the full, non-truncated description.
    expect(screen.getAllByText('Some details').length).toBeGreaterThan(0);
  });

  it('shows "No description" in the details modal when there is none', async () => {
    render(<TaskItem {...makeTask({ description: null })} />);

    await userEvent.click(screen.getByText('Write tests'));

    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('closes the task details modal when the close button is clicked', async () => {
    render(<TaskItem {...makeTask()} />);

    await userEvent.click(screen.getByText('Write tests'));
    expect(screen.getByText('Task Details')).toBeInTheDocument();

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(
      (btn) => !btn.textContent?.includes('task-btn'),
    );
    await userEvent.click(closeButton!);

    expect(screen.queryByText('Task Details')).not.toBeInTheDocument();
  });

  it('applies the disabled styling when disabled is true', () => {
    const { container } = render(<TaskItem {...makeTask()} disabled />);
    expect(container.firstChild).toHaveClass('cursor-not-allowed');
  });
});
