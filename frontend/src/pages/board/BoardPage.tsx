import { Board } from '@widgets/board';
import { useParams } from 'react-router-dom';

export const BoardPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  return (
    <div className="p-4">
      <Board boardId={boardId} />
    </div>
  );
};
