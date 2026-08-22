export type Board = {
  id: string;
  name: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
};

export type BoardCreateData = Pick<Board, 'name'>;

export type Column = {
  id: string;
  name: string;
  order: number;
  type: ColumnType;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
};

export type ColumnType = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type Task = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  columnId: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskCreateData = Pick<Task, 'name' | 'description' | 'columnId'>;
export type TaskUpdateData = Partial<Pick<Task, 'name' | 'description'>>;
export type TaskMoveData = {
  newColumnId: string;
  afterTaskId?: string;
  beforeTaskId?: string;
};
