import { useDeleteBoardMutation } from '@entities/board';
import { useModalLock } from '@/shared/lib';
import { DeleteButton } from '@/shared/ui/Buttons';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const DeleteBoardButton = ({ boardId }: { boardId: string }) => {
  const [deleteBoard, { isLoading }] = useDeleteBoardMutation();
  const [isFormVisible, setIsFormVisible] = useState(false);
  useModalLock(isFormVisible);
  const navigate = useNavigate();

  const handleDelete = async () => {
    setIsFormVisible(true);
  };

  return (
    <>
      <DeleteButton onClick={handleDelete} isLoading={isLoading} />
      {isFormVisible &&
        createPortal(
          <DeleteBoardConfirmation
            onConfirm={async () => {
              try {
                await deleteBoard(boardId).unwrap();
                toast.success('Board deleted successfully');
                setIsFormVisible(false);
                navigate('/');
              } catch {
                toast.error('Failed to delete board');
              }
            }}
            onCancel={() => {
              setIsFormVisible(false);
              toast('Board deletion canceled');
            }}
            onClose={() => setIsFormVisible(false)}
          />,
          document.body,
        )}
    </>
  );
};

const DeleteBoardConfirmation = ({
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
          Are you sure you want to delete this board? This action cannot be
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
