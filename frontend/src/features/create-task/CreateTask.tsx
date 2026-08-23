import { useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCreateTaskMutation } from '@entities/task';
import { Plus, X } from 'lucide-react';

export const AddTaskButton = ({ columnId }: { columnId: string }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);

  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };

  return (
    <div>
      <button
        onClick={toggleFormVisibility}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 hover:cursor-pointer mt-2 select-none"
      >
        <Plus className="inline-block mr-2 w-4 h-4" />
        Add Task
      </button>

      {isFormVisible && (
        <TaskFormCreate columnId={columnId} onClose={toggleFormVisibility} />
      )}
    </div>
  );
};

const TaskFormCreate = ({
  columnId,
  onClose,
}: {
  columnId: string;
  onClose: () => void;
}) => {
  const [createTask] = useCreateTaskMutation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { boardId } = useParams<{ boardId: string }>();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!boardId || !columnId) return;

    try {
      await createTask({
        name: name.trim(),
        description: description.trim(),
        columnId,
      }).unwrap();

      toast.success('Task created successfully');
      onClose();
    } catch {
      toast.error('Failed to create task');
    }
  };

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
          <h2 className="text-lg font-semibold">New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100 hover:cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 hover:cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
