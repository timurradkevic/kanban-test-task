import { useState } from 'react';
import { useGetBoardQuery, useUpdateBoardMutation } from '@entities/board';
import { ColumnCard } from '@entities/column';
import { BackButton, CopyButton, UpdateButton } from '@shared/ui/Buttons';
import { useNavigate } from 'react-router-dom';
import { NotFound } from '@widgets/notFound';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type CollisionDetection,
  pointerWithin,
  rectIntersection,
  closestCenter,
  getFirstCollision,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { handleDragEnd, resolveColumnId } from '@/features/move-task';
import { useMoveTaskMutation, TaskItemPreview } from '@entities/task';
import { useAppSelector } from '@app/store/hooks';
import { selectIsAnyModalOpen } from '@shared/model';
import { BoardName } from '@features/update-board';
import { DeleteBoardButton } from '@features/delete-board';

const SkeletonBoard = () => {
  return (
    <>
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200 mb-2" />
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 grid gap-4 md:grid-rows-1 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, columnIndex) => (
          <div
            key={columnIndex}
            className="mb-4 flex flex-col border p-4 rounded shadow"
          >
            <div className="h-6 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 3 }).map((__, taskIndex) => (
                <div
                  key={taskIndex}
                  className="h-4 w-full animate-pulse rounded bg-slate-200"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export const Board = ({ boardId }: { boardId: string | undefined }) => {
  const {
    data: board,
    error,
    isLoading,
    refetch,
  } = useGetBoardQuery(boardId || '', {
    skip: !boardId,
  });
  const isAnyModalOpen = useAppSelector(selectIsAnyModalOpen);
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  const sensors = useSensors(pointerSensor);
  const [moveTask, { isLoading: isMoving }] = useMoveTaskMutation();
  const navigate = useNavigate();

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const [isRenaming, setIsRenaming] = useState(false);
  const [updateBoard] = useUpdateBoardMutation();

  const isNotFoundError = (
    currentError: typeof error,
  ): currentError is { status: number; data: unknown } =>
    !!currentError &&
    typeof currentError === 'object' &&
    'status' in currentError &&
    currentError.status === 404;

  if (isLoading) {
    return <SkeletonBoard />;
  }

  if (error && !isNotFoundError(error)) {
    return (
      <NotFound
        title="Error loading board"
        code={500}
        navigate={navigate}
        refetch={refetch}
      />
    );
  }

  if (error && isNotFoundError(error)) {
    return (
      <NotFound
        title="Board not found"
        code={404}
        navigate={navigate}
        refetch={refetch}
      />
    );
  }

  if (!boardId || !board) {
    return (
      <NotFound
        title="Board not found"
        code={404}
        navigate={navigate}
        refetch={() => {}}
      />
    );
  }

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    const intersections =
      pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);

    let overId = getFirstCollision(intersections, 'id') as string | undefined;

    if (overId != null) {
      const column = board.columns.find((c) => c.id === overId);

      if (column && column.tasks.length > 0) {
        const taskIds = column.tasks.map((task) => task.id);
        const refined = closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((container) =>
            taskIds.includes(container.id as string),
          ),
        });
        const refinedId = getFirstCollision(refined, 'id') as
          string | undefined;
        if (refinedId != null) {
          overId = refinedId;
        }
      }
    }

    return overId != null ? [{ id: overId }] : [];
  };

  const allTasks = board.columns.flatMap((column) => column.tasks);
  const activeTask = activeTaskId
    ? allTasks.find((task) => task.id === activeTaskId)
    : null;

  const onDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const onDragOver = (event: DragOverEvent) => {
    const columnId = resolveColumnId(
      event.over?.id as string | undefined,
      board.columns,
    );
    setOverColumnId(columnId ?? null);
  };

  const resetDragState = () => {
    setActiveTaskId(null);
    setOverColumnId(null);
  };

  return (
    <>
      <BackButton navigate={navigate} />
      <div className="flex items-center justify-between mx-2">
        <BoardName
          board={board}
          isRenaming={isRenaming}
          setIsRenaming={setIsRenaming}
          updateBoard={updateBoard}
        />
        <div className="flex gap-2">
          <UpdateButton onClick={() => setIsRenaming(true)} />
          <DeleteBoardButton boardId={board.id} />
        </div>
      </div>
      <div className="mx-2">
        <div className="flex items-center">
          <span className="text-gray-600 mr-4">{board.id.slice(0, 12)}...</span>
          <CopyButton textToCopy={board.id} textLabel="Board ID" />
        </div>
        <div className="mt-4 grid gap-4 md:grid-rows-1 lg:grid-cols-3">
          <DndContext
            sensors={isAnyModalOpen ? [] : sensors}
            collisionDetection={collisionDetectionStrategy}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={(event) => {
              handleDragEnd(event, board.id, board.columns, moveTask);
              resetDragState();
            }}
            onDragCancel={resetDragState}
          >
            {board.columns.map((column) => (
              <SortableContext
                key={column.id}
                items={column.tasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                <ColumnCard
                  column={column}
                  isDropTarget={column.id === overColumnId}
                  isDragDisabled={isMoving}
                />
              </SortableContext>
            ))}

            <DragOverlay>
              {activeTask ? (
                <TaskItemPreview
                  name={activeTask.name}
                  description={activeTask.description ?? undefined}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </>
  );
};
