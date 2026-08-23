import { useGetBoardQuery } from '@entities/board';
import { ColumnCard } from '@entities/column';
import { BackButton, CopyButton } from '@shared/ui/Buttons';
import { useNavigate } from 'react-router-dom';
import { NotFound } from '@widgets/notFound';

const SkeletonBoard = () => {
  return (
    <>
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200 mb-2" />
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 grid gap-4 md:grid-rows-1 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, columnIndex) => (
          <div
            key={columnIndex}
            className="mb-4 flex flex-col border p-4 rounded shadow"
          >
            <div className="h-6 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 3 }).map((__, taskIndex) => (
                <div
                  key={taskIndex}
                  className="h-4 w-full animate-pulse rounded bg-slate-200"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export const Board = ({ boardId }: { boardId: string | undefined }) => {
  const {
    data: board,
    error,
    isLoading,
    refetch,
  } = useGetBoardQuery(boardId || '', {
    skip: !boardId,
  });
  const navigate = useNavigate();
  const isNotFoundError = (
    currentError: typeof error,
  ): currentError is { status: number; data: unknown } =>
    !!currentError &&
    typeof currentError === 'object' &&
    'status' in currentError &&
    currentError.status === 404;

  if (isLoading) {
    return <SkeletonBoard />;
  }

  if (error && !isNotFoundError(error)) {
    return (
      <NotFound
        title="Error loading board"
        code={500}
        navigate={navigate}
        refetch={refetch}
      />
    );
  }

  if (error && isNotFoundError(error)) {
    return (
      <NotFound
        title="Board not found"
        code={404}
        navigate={navigate}
        refetch={refetch}
      />
    );
  }

  if (!boardId || !board) {
    return (
      <NotFound
        title="Board not found"
        code={404}
        navigate={navigate}
        refetch={() => {}}
      />
    );
  }

  return (
    <>
      <BackButton navigate={navigate} />
      <div className="mx-2">
        <h1 className="text-2xl font-bold mb-2">{board.name}</h1>
        <div className="flex items-center">
          <span className="text-gray-600 mr-4">{board.id.slice(0, 12)}...</span>
          <CopyButton textToCopy={board.id} textLabel="Board ID" />
        </div>
        <div className="mt-4 grid gap-4 md:grid-rows-1 lg:grid-cols-3">
          {board.columns.map((column) => (
            <ColumnCard key={column.id} column={column} />
          ))}
        </div>
      </div>
    </>
  );
};
