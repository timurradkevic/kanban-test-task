import { AddTaskButton } from '@features/create-task';
import type { Column } from '@entities/column';
import { TaskItem } from '@entities/task';
import { useDroppable } from '@dnd-kit/core';

export const ColumnCard = ({
  column,
  isDropTarget,
  isDragDisabled,
}: {
  column: Column;
  isDropTarget?: boolean;
  isDragDisabled?: boolean;
}) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      className={`mb-4 border p-4 rounded shadow min-w-62.5 transition-colors ${
        isDropTarget ? 'bg-blue-100 border-blue-400' : ''
      }`}
      ref={setNodeRef}
    >
      <h2 className="text-xl font-semibold">{column.name}</h2>
      <div className="flex flex-col mt-2">
        {column.tasks && column.tasks.length === 0 && (
          <p className="text-gray-500 italic">No tasks in this column</p>
        )}
        {column.tasks &&
          column.tasks.length > 0 &&
          column.tasks.map((task) => (
            <TaskItem key={task.id} {...task} disabled={isDragDisabled} />
          ))}
        <AddTaskButton columnId={column.id} />
      </div>
    </div>
  );
};
