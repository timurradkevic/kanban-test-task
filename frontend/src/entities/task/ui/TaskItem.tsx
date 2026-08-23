import { useSortable } from '@dnd-kit/sortable';
import type { Task } from '../model/types';
import { CSS } from '@dnd-kit/utilities';

type TaskItemProps = Pick<Task, 'name' | 'id'> &
  Partial<Pick<Task, 'description'>> & {
    disabled?: boolean;
  };

export const TaskItem = ({ disabled, ...task }: TaskItemProps) => {
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
      className={`text-gray-500 italic border p-2 rounded mb-2 w-full ${
        isDragging ? 'z-10 opacity-50' : ''
      } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <h3 className="font-semibold select-none">{task.name}</h3>
      {task.description && (
        <p className="text-sm wrap-break-word select-none">
          {task.description.slice(0, 100)}
          {task.description.length > 100 ? '...' : ''}
        </p>
      )}
    </div>
  );
};
