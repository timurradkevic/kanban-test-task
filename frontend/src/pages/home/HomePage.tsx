import { useCreateBoardMutation } from '@entities/board';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const HomePage = () => {
  const [boardId, setBoardId] = useState('');
  const [boardIdError, setBoardIdError] = useState<boolean>(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [boardNameError, setBoardNameError] = useState<boolean>(false);
  const navigate = useNavigate();
  const [createBoard, { isLoading }] = useCreateBoardMutation();
  const isSubmittingRef = useRef(false);

  const handleGoToBoard = () => {
    if (!boardId.trim()) {
      setBoardIdError(true);
      toast.error('Board ID cannot be empty');
      return;
    }
    navigate(`/board/${boardId.trim()}`);
  };

  const handleCreateBoard = async (name: string) => {
    if (isSubmittingRef.current) return;

    if (!name.trim()) {
      setBoardNameError(true);
      toast.error('Board name cannot be empty');
      return;
    }

    isSubmittingRef.current = true;
    try {
      const board = await createBoard({ name: name.trim() }).unwrap();
      navigate(`/board/${board.id}`);
    } catch (err) {
      toast.error('Failed to create board');
      console.error('Failed to create board:', err);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="p-4 justify-center items-center flex flex-col">
      <h1 className="text-2xl font-bold">Home</h1>
      <form
        className="my-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleGoToBoard();
        }}
      >
        <input
          className={`w-full border border-gray-300 rounded px-2 py-1 mr-2 mb-4 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${boardIdError ? 'border-red-500' : ''}`}
          value={boardId}
          onChange={(e) => {
            setBoardId(e.target.value);
            if (boardIdError) setBoardIdError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleGoToBoard();
            }
            if (e.key === 'Escape') {
              setBoardId('');
              setBoardIdError(false);
            }
          }}
          placeholder="Enter Board ID"
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:cursor-pointer hover:bg-blue-600"
          type="submit"
        >
          Go to board
        </button>
      </form>
      <form
        className="my-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateBoard(newBoardName);
        }}
      >
        <input
          className={`w-full border border-gray-300 rounded px-2 py-1 mr-2 mb-4 hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 ${boardNameError ? 'border-red-500' : ''}`}
          value={newBoardName}
          disabled={isLoading}
          onChange={(e) => {
            setNewBoardName(e.target.value);
            if (boardNameError) setBoardNameError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleCreateBoard(newBoardName);
            }
            if (e.key === 'Escape') {
              setNewBoardName('');
              setBoardNameError(false);
            }
          }}
          placeholder="Enter New Board Name"
        />
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:cursor-pointer hover:bg-green-600"
          type="submit"
          disabled={isLoading}
        >
          Create Board
        </button>
      </form>
    </div>
  );
};
