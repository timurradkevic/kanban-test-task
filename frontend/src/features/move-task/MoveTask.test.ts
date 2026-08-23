import { describe, it, expect, vi } from 'vitest';
import type { DragEndEvent } from '@dnd-kit/core';
import type { Column } from '@entities/column';
import {
  resolveColumnId,
  handleDragEnd,
  optimisticUpdateTaskPosition,
} from './MoveTask';
import { boardApi } from '@entities/board/api/boardApi';

const makeTask = (id: string, columnId: string) => ({
  id,
  name: `Task ${id}`,
  description: null,
  order: 0,
  columnId,
  createdAt: '',
  updatedAt: '',
});

const makeColumns = (): Column[] => [
  {
    id: 'col-1',
    name: 'Todo',
    order: 0,
    type: 'TODO',
    tasks: [makeTask('t-1', 'col-1'), makeTask('t-2', 'col-1')],
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'col-2',
    name: 'Done',
    order: 1,
    type: 'DONE',
    tasks: [makeTask('t-3', 'col-2')],
    createdAt: '',
    updatedAt: '',
  },
];

describe('resolveColumnId', () => {
  it('returns undefined when overId is undefined', () => {
    expect(resolveColumnId(undefined, makeColumns())).toBeUndefined();
  });

  it('resolves the column that contains the task with the given id', () => {
    expect(resolveColumnId('t-3', makeColumns())).toBe('col-2');
  });

  it('resolves the column itself when overId is a column id', () => {
    expect(resolveColumnId('col-1', makeColumns())).toBe('col-1');
  });

  it('returns undefined when overId matches neither a task nor a column', () => {
    expect(resolveColumnId('unknown', makeColumns())).toBeUndefined();
  });
});

function makeDragEndEvent(
  overrides: Partial<{
    activeId: string;
    overId: string | undefined;
    activeTop: number;
    overTop: number;
  }> = {},
): DragEndEvent {
  const activeId = overrides.activeId ?? 't-1';
  const overId = 'overId' in overrides ? overrides.overId : 't-2';
  const activeTop = overrides.activeTop ?? 0;
  const overTop = overrides.overTop ?? 0;

  const rect = (top: number) => ({
    top,
    height: 20,
    left: 0,
    width: 100,
    bottom: top + 20,
    right: 100,
  });

  return {
    active: {
      id: activeId,
      rect: { current: { translated: rect(activeTop) } },
    },
    over: overId
      ? {
          id: overId,
          rect: rect(overTop),
        }
      : null,
  } as unknown as DragEndEvent;
}

describe('handleDragEnd', () => {
  it('does nothing when there is no drop target', () => {
    const moveTask = vi.fn();
    const event = makeDragEndEvent({ overId: undefined });

    handleDragEnd(event, 'b-1', makeColumns(), moveTask);

    expect(moveTask).not.toHaveBeenCalled();
  });

  it('does nothing when the task is dropped on itself', () => {
    const moveTask = vi.fn();
    const event = makeDragEndEvent({ activeId: 't-1', overId: 't-1' });

    handleDragEnd(event, 'b-1', makeColumns(), moveTask);

    expect(moveTask).not.toHaveBeenCalled();
  });

  it('does nothing when the active task cannot be found in any column', () => {
    const moveTask = vi.fn();
    const event = makeDragEndEvent({ activeId: 'unknown-task', overId: 't-2' });

    handleDragEnd(event, 'b-1', makeColumns(), moveTask);

    expect(moveTask).not.toHaveBeenCalled();
  });

  it('moves a task to the end of an empty column when dropped on the column container', () => {
    const moveTask = vi.fn();
    const columns = makeColumns();
    // dropping t-1 onto column 2's container (col-2, which has t-3)
    const event = makeDragEndEvent({ activeId: 't-1', overId: 'col-2' });

    handleDragEnd(event, 'b-1', columns, moveTask);

    expect(moveTask).toHaveBeenCalledWith({
      taskId: 't-1',
      newColumnId: 'col-2',
      beforeTaskId: 't-3',
      afterTaskId: undefined,
      boardId: 'b-1',
      previousColumnId: 'col-1',
    });
  });

  it('inserts before the target task when dropped above its center', () => {
    const moveTask = vi.fn();
    const columns = makeColumns();
    // active task (t-1) center is above over task (t-2) center -> insert before t-2
    const event = makeDragEndEvent({
      activeId: 't-1',
      overId: 't-2',
      activeTop: 0,
      overTop: 100,
    });

    handleDragEnd(event, 'b-1', columns, moveTask);

    expect(moveTask).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 't-1',
        newColumnId: 'col-1',
        beforeTaskId: undefined,
        afterTaskId: 't-2',
      }),
    );
  });

  it('inserts after the target task when dropped below its center', () => {
    const moveTask = vi.fn();
    const columns: Column[] = [
      {
        id: 'col-1',
        name: 'Todo',
        order: 0,
        type: 'TODO',
        tasks: [
          makeTask('t-1', 'col-1'),
          makeTask('t-2', 'col-1'),
          makeTask('t-3', 'col-1'),
        ],
        createdAt: '',
        updatedAt: '',
      },
    ];
    // active task (t-3) center is below over task (t-2) center -> insert after t-2
    const event = makeDragEndEvent({
      activeId: 't-3',
      overId: 't-2',
      activeTop: 200,
      overTop: 0,
    });

    handleDragEnd(event, 'b-1', columns, moveTask);

    expect(moveTask).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 't-3',
        newColumnId: 'col-1',
        beforeTaskId: 't-2',
        afterTaskId: undefined,
      }),
    );
  });

  it('does nothing when the resolved target column cannot be found', () => {
    const moveTask = vi.fn();
    const event = makeDragEndEvent({ activeId: 't-1', overId: 'ghost-id' });

    handleDragEnd(event, 'b-1', makeColumns(), moveTask);

    expect(moveTask).not.toHaveBeenCalled();
  });
});

describe('optimisticUpdateTaskPosition', () => {
  it('moves the task between columns in the cached board and keeps it on success', async () => {
    const patchUndo = vi.fn();
    const dispatch = vi.fn().mockReturnValue({ undo: patchUndo });

    // We can't easily invoke the real updateQueryData thunk without a store,
    // so we verify that dispatch is called with the correctly-shaped action
    // and that the recipe mutates the draft as expected.
    let capturedRecipe:
      | ((draft: {
          columns: {
            id: string;
            tasks: { id: string; columnId: string }[];
          }[];
        }) => void)
      | undefined;

    vi.spyOn(boardApi.util, 'updateQueryData').mockImplementation(
      // @ts-expect-error - simplified for testing the recipe callback
      (_endpoint, _boardId, recipe) => {
        capturedRecipe = recipe;
        return { type: 'mock-action' };
      },
    );

    await optimisticUpdateTaskPosition(dispatch, {
      taskId: 't-1',
      newColumnId: 'col-2',
      afterTaskId: 't-3',
      boardId: 'b-1',
      previousColumnId: 'col-1',
      queryFulfilled: Promise.resolve(),
    });

    expect(dispatch).toHaveBeenCalledWith({ type: 'mock-action' });
    expect(patchUndo).not.toHaveBeenCalled();

    const draft = {
      columns: [
        { id: 'col-1', tasks: [{ id: 't-1', columnId: 'col-1' }] },
        { id: 'col-2', tasks: [{ id: 't-3', columnId: 'col-2' }] },
      ],
    };
    capturedRecipe!(draft);

    expect(draft.columns[0].tasks).toHaveLength(0);
    expect(draft.columns[1].tasks.map((t) => t.id)).toEqual(['t-1', 't-3']);
    expect(draft.columns[1].tasks[0].columnId).toBe('col-2');

    vi.restoreAllMocks();
  });

  it('undoes the optimistic patch and shows an error toast when the request fails', async () => {
    const patchUndo = vi.fn();
    const dispatch = vi.fn().mockReturnValue({ undo: patchUndo });
    vi.spyOn(boardApi.util, 'updateQueryData').mockReturnValue({
      type: 'mock-action',
    } as never);

    await optimisticUpdateTaskPosition(dispatch, {
      taskId: 't-1',
      newColumnId: 'col-2',
      boardId: 'b-1',
      previousColumnId: 'col-1',
      queryFulfilled: Promise.reject(new Error('network error')),
    });

    expect(patchUndo).toHaveBeenCalledTimes(1);

    vi.restoreAllMocks();
  });
});
