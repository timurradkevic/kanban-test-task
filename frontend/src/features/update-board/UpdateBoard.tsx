import type { Board } from '@entities/board';

export const BoardName = ({
  board,
  isRenaming,
  setIsRenaming,
  updateBoard,
}: {
  board: Board;
  isRenaming: boolean;
  setIsRenaming: (isRenaming: boolean) => void;
  updateBoard: (args: { boardId: string; data: Partial<Board> }) => void;
}) => {
  const handleBoardNameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsRenaming(false);
    const formData = new FormData(e.currentTarget);
    const newName = formData.get('boardName') as string;
    if (board) {
      updateBoard({ boardId: board.id, data: { name: newName } });
    }
  };

  return (
    <>
      {isRenaming ? (
        <form onSubmit={handleBoardNameSubmit}>
          <input
            type="text"
            name="boardName"
            className="text-2xl font-bold leading-none"
            defaultValue={board.name}
            onBlur={() => setIsRenaming(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.form?.requestSubmit();
              }
              if (e.key === 'Escape') {
                setIsRenaming(false);
              }
            }}
            autoFocus
          />
        </form>
      ) : (
        <h1 className="text-2xl font-bold mb-0 leading-none">{board.name}</h1>
      )}
    </>
  );
};
