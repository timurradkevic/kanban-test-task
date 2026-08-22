import type { Column } from '@/entities/board/model/types';
import { TaskItem } from '@/entities/task/ui/TaskItem';

export const ColumnCard = ({ column }: { column: Column }) => {
  return (
    <div className="mb-4 border p-4 rounded shadow">
      <h2 className="text-xl font-semibold">{column.name}</h2>
      <div className="flex flex-col mt-2">
        {column.tasks && column.tasks.length === 0 && (
          <TaskItem name="No tasks available" />
        )}
        {column.tasks &&
          column.tasks.length > 0 &&
          column.tasks.map((task) => (
            <TaskItem
              key={task.id}
              name={task.name}
              description={task.description ?? undefined}
            />
          ))}
      </div>
    </div>
  );
};
