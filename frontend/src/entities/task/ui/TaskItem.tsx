import type { Task } from '../model/types';

type TaskItemProps = Pick<Task, 'name'> & Partial<Pick<Task, 'description'>>;

export const TaskItem = (task: TaskItemProps) => {
  return (
    <div className="text-gray-500 italic border p-2 rounded mb-2 w-full">
      <h3 className="font-semibold">{task.name}</h3>
      {task.description && (
        <p className="text-sm wrap-break-word">
          {task.description.slice(0, 100)}
          {task.description.length > 100 ? '...' : ''}
        </p>
      )}
    </div>
  );
};
