import type { Column } from '@/entities/column';
import type { DragEndEvent } from '@dnd-kit/core';
import toast from 'react-hot-toast';
import { boardApi } from '@/entities/board/api/boardApi';

type MoveTaskArgs = {
  taskId: string;
  newColumnId: string;
  afterTaskId?: string;
  beforeTaskId?: string;
  boardId: string;
  previousColumnId: string;
};

export const resolveColumnId = (
  overId: string | undefined,
  columns: Column[],
): string | undefined => {
  if (!overId) return undefined;

  const columnByTask = columns.find((column) =>
    column.tasks.some((task) => task.id === overId),
  );
  if (columnByTask) return columnByTask.id;

  const columnById = columns.find((column) => column.id === overId);
  return columnById?.id;
};

export const handleDragEnd = (
  event: DragEndEvent,
  boardId: string,
  columns: Column[],
  moveTask: (args: MoveTaskArgs) => void,
) => {
  const { active, over } = event;

  if (!over) return;

  const activeTaskId = active.id as string;
  const overId = over.id as string;

  if (activeTaskId === overId) return;

  const activeColumn = columns.find((column) =>
    column.tasks.some((task) => task.id === activeTaskId),
  );
  if (!activeColumn) return;

  const newColumnId = resolveColumnId(overId, columns);
  const overColumn = columns.find((column) => column.id === newColumnId);
  if (!overColumn) return;

  const targetTasks = overColumn.tasks.filter(
    (task) => task.id !== activeTaskId,
  );
  const droppedOnColumnContainer = overId === overColumn.id;

  let beforeTaskId: string | undefined;
  let afterTaskId: string | undefined;

  if (droppedOnColumnContainer) {
    beforeTaskId = targetTasks.at(-1)?.id;
    afterTaskId = undefined;
  } else {
    const overIndex = targetTasks.findIndex((task) => task.id === overId);

    const activeRect = active.rect.current.translated;
    const overRect = over.rect;
    const insertAfter =
      !!activeRect &&
      activeRect.top + activeRect.height / 2 >
        overRect.top + overRect.height / 2;

    if (insertAfter) {
      beforeTaskId = overId;
      afterTaskId =
        overIndex < targetTasks.length - 1
          ? targetTasks[overIndex + 1].id
          : undefined;
    } else {
      beforeTaskId = overIndex > 0 ? targetTasks[overIndex - 1].id : undefined;
      afterTaskId = overIndex >= 0 ? overId : undefined;
    }
  }

  moveTask({
    taskId: activeTaskId,
    newColumnId: overColumn.id,
    beforeTaskId,
    afterTaskId,
    boardId,
    previousColumnId: activeColumn.id,
  });
};

type OptimisticMoveArgs = {
  taskId: string;
  newColumnId: string;
  beforeTaskId?: string;
  afterTaskId?: string;
  boardId: string;
  previousColumnId: string;
  queryFulfilled: Promise<unknown>;
};

export const optimisticUpdateTaskPosition = async (
  dispatch: (action: ReturnType<typeof boardApi.util.updateQueryData>) => {
    undo: () => void;
  },
  {
    taskId,
    newColumnId,
    beforeTaskId,
    afterTaskId,
    boardId,
    queryFulfilled,
  }: OptimisticMoveArgs,
) => {
  const patch = dispatch(
    boardApi.util.updateQueryData('getBoard', boardId, (draft) => {
      const sourceColumn = draft.columns.find((column) =>
        column.tasks.some((task) => task.id === taskId),
      );
      const targetColumn = draft.columns.find(
        (column) => column.id === newColumnId,
      );

      if (!sourceColumn || !targetColumn) return;

      const taskIndex = sourceColumn.tasks.findIndex(
        (task) => task.id === taskId,
      );
      const [task] = sourceColumn.tasks.splice(taskIndex, 1);

      if (!task) return;

      task.columnId = newColumnId;

      const insertIndex = beforeTaskId
        ? targetColumn.tasks.findIndex((t) => t.id === beforeTaskId) + 1
        : afterTaskId
          ? targetColumn.tasks.findIndex((t) => t.id === afterTaskId)
          : targetColumn.tasks.length;

      const safeIndex =
        insertIndex >= 0 ? insertIndex : targetColumn.tasks.length;

      targetColumn.tasks.splice(safeIndex, 0, task);
    }),
  );

  try {
    await queryFulfilled;
  } catch {
    patch.undo();
    toast.error('Failed to move task');
  }
};
