import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const HomePage = () => {
  const [boardId, setBoardId] = useState('');
  const navigate = useNavigate();

  const handleGoToBoard = () => {
    if (boardId.trim()) {
      navigate(`/board/${boardId.trim()}`);
    }
  };

  return (
    <div>
      <h1>Home</h1>
      <input
        value={boardId}
        onChange={(e) => setBoardId(e.target.value)}
        placeholder="Enter board ID"
      />
      <button onClick={handleGoToBoard}>Go to board</button>
    </div>
  );
};
