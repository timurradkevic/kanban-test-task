import { useParams } from 'react-router-dom';

export const BoardPage = () => {
  const { boardId } = useParams<{ boardId: string }>();

  return (
    <div>
      <h1>Board page</h1>
      <p>Board ID: {boardId}</p>
    </div>
  );
};
