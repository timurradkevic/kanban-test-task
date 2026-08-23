export type Task = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  columnId: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskCreateData = Pick<Task, 'name' | 'columnId'> &
  Partial<Pick<Task, 'description'>>;
export type TaskUpdateData = Partial<Pick<Task, 'name' | 'description'>>;
export type TaskMoveData = {
  newColumnId: string;
  afterTaskId?: string;
  beforeTaskId?: string;
};
