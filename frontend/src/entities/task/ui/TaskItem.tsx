import { useSortable } from '@dnd-kit/sortable';
import type { Task } from '../model/types';
import { CSS } from '@dnd-kit/utilities';
import { UpdateTaskButton } from '@/features/update-task';
import { DeleteTaskButton } from '@/features/delete-task';

export const TaskItem = ({
  disabled,
  ...task
}: Task & { disabled?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled,
  });

  return (
    <div
      className={`text-gray-500 italic border p-2 rounded mb-2 w-full flex justify-between items-center ${
        isDragging ? 'z-10 opacity-50' : ''
      } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <div className="flex-1 min-w-0 pr-2">
        <h3 className="font-semibold select-none">{task.name}</h3>
        {task.description && (
          <p className="text-sm wrap-break-word select-none">
            {task.description.slice(0, 100)}
            {task.description.length > 100 ? '...' : ''}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <UpdateTaskButton task={task} />
        <DeleteTaskButton taskId={task.id} columnId={task.columnId} />
      </div>
    </div>
  );
};
