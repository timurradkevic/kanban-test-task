import { prisma } from '../config/prisma.js';
import type { Board } from '../generated/prisma/client.js';
import { ColumnType } from '../generated/prisma/client.js';

type BoardData = Pick<Board, 'name'>;

export const boardService = {
  getBoardById: async (id: string) => {
    return prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  },
  createBoard: async (boardData: BoardData) => {
    return prisma.board.create({
      data: {
        name: boardData.name,
        columns: {
          create: [
            { name: 'To Do', order: 1, type: ColumnType.TODO },
            { name: 'In Progress', order: 2, type: ColumnType.IN_PROGRESS },
            { name: 'Done', order: 3, type: ColumnType.DONE },
          ],
        },
      },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  },
};
