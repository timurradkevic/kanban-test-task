import { useSortable } from '@dnd-kit/sortable';
import type { Task } from '../model/types';
import { CSS } from '@dnd-kit/utilities';
import { UpdateTaskButton } from '@/features/update-task';
import { DeleteTaskButton } from '@/features/delete-task';
import { useModalLock } from '@shared/lib';
import { useState } from 'react';
import { X } from 'lucide-react';

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
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  useModalLock(isDetailsVisible);

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
      <div
        className="flex-1 min-w-0 pr-2 cursor-pointer"
        onClick={() => setIsDetailsVisible(true)}
      >
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
      {isDetailsVisible && (
        <TaskDetails
          task={task}
          columnId={task.columnId}
          onClose={() => setIsDetailsVisible(false)}
        />
      )}
    </div>
  );
};

const TaskDetails = ({
  task,
  onClose,
}: {
  task: Task;
  columnId: string;
  onClose: () => void;
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Task Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-700">Name</h3>
            <p className="text-gray-900">{task.name}</p>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-700">
              Description
            </h3>
            <p className="max-h-60 overflow-y-auto whitespace-pre-wrap wrap-break-word text-gray-900">
              {task.description || 'No description'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
