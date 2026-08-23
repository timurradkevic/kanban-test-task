import { useDeleteTaskMutation } from '@/entities/task';
import { useModalLock } from '@/shared/lib';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

export const DeleteTaskButton = ({
  taskId,
  columnId,
}: {
  taskId: string;
  columnId: string;
}) => {
  const [deleteTask, { isLoading }] = useDeleteTaskMutation();
  const [isFormVisible, setIsFormVisible] = useState(false);
  useModalLock(isFormVisible);

  const handleDelete = async () => {
    setIsFormVisible(true);
  };

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isLoading}
        className="bg-red-500 text-white rounded hover:bg-red-600 hover:cursor-pointer mt-2 select-none flex items-center justify-center w-8 h-8"
      >
        <Trash2 className="inline-block w-4 h-4" />
      </button>
      {isFormVisible &&
        createPortal(
          <DeleteTaskConfirmation
            onConfirm={async () => {
              try {
                await deleteTask({ taskId, columnId }).unwrap();
                toast.success('Task deleted successfully');
                setIsFormVisible(false);
              } catch {
                toast.error('Failed to delete task');
              }
            }}
            onCancel={() => {
              setIsFormVisible(false);
              toast('Task deletion canceled');
            }}
            onClose={() => setIsFormVisible(false)}
          />,
          document.body,
        )}
    </>
  );
};

const DeleteTaskConfirmation = ({
  onConfirm,
  onCancel,
  onClose,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
        <p className="mb-4">
          Are you sure you want to delete this task? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 hover:cursor-pointer select-none"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 hover:cursor-pointer select-none"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
