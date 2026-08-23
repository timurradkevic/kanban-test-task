import type { Column } from '@entities/column';

export type Board = {
  id: string;
  name: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
};

export type BoardCreateData = Pick<Board, 'name'>;
