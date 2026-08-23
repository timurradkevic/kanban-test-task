import type { Task } from '@entities/task';

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
