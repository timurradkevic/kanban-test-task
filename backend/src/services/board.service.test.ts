import { describe, it, expect, vi, beforeEach } from 'vitest';
import { boardService } from './board.service.js';
import { prisma } from '../config/prisma.js';
import { ColumnType } from '../generated/prisma/client.js';
import type { Board } from '../generated/prisma/client.js';

vi.mock('../config/prisma.js', () => ({
  prisma: {
    board: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

function makeBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: 'board-1',
    name: 'My Board',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const INCLUDE_COLUMNS_WITH_TASKS = {
  columns: {
    orderBy: { order: 'asc' },
    include: {
      tasks: {
        orderBy: { order: 'asc' },
      },
    },
  },
};

describe('boardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBoardById', () => {
    it('returns the board with its columns and tasks when found', async () => {
      const board = { ...makeBoard(), columns: [] };
      vi.mocked(prisma.board.findUnique).mockResolvedValue(
        board as unknown as Board,
      );

      const result = await boardService.getBoardById('board-1');

      expect(result).toEqual(board);
    });

    it('returns null when the board does not exist', async () => {
      vi.mocked(prisma.board.findUnique).mockResolvedValue(null);

      expect(await boardService.getBoardById('missing')).toBeNull();
    });

    it('requests columns ordered ascending, each with its tasks ordered ascending', async () => {
      vi.mocked(prisma.board.findUnique).mockResolvedValue(null);

      await boardService.getBoardById('board-1');

      expect(prisma.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        include: INCLUDE_COLUMNS_WITH_TASKS,
      });
    });
  });

  describe('createBoard', () => {
    it('creates the board and returns it with its columns and tasks', async () => {
      const createdBoard = {
        ...makeBoard({ name: 'New Board' }),
        columns: [],
      };
      vi.mocked(prisma.board.create).mockResolvedValue(
        createdBoard as unknown as Board,
      );

      const result = await boardService.createBoard({ name: 'New Board' });

      expect(result).toEqual(createdBoard);
    });

    it('seeds the board with the three default columns: To Do, In Progress, Done', async () => {
      vi.mocked(prisma.board.create).mockResolvedValue(
        makeBoard() as unknown as Board,
      );

      await boardService.createBoard({ name: 'New Board' });

      expect(prisma.board.create).toHaveBeenCalledWith({
        data: {
          name: 'New Board',
          columns: {
            create: [
              { name: 'To Do', order: 1, type: ColumnType.TODO },
              { name: 'In Progress', order: 2, type: ColumnType.IN_PROGRESS },
              { name: 'Done', order: 3, type: ColumnType.DONE },
            ],
          },
        },
        include: INCLUDE_COLUMNS_WITH_TASKS,
      });
    });

    it('requests columns ordered ascending, each with its tasks ordered ascending, for the created board', async () => {
      vi.mocked(prisma.board.create).mockResolvedValue(
        makeBoard() as unknown as Board,
      );

      await boardService.createBoard({ name: 'New Board' });

      expect(prisma.board.create).toHaveBeenCalledWith(
        expect.objectContaining({ include: INCLUDE_COLUMNS_WITH_TASKS }),
      );
    });
  });

  describe('updateBoard', () => {
    it('updates the board and returns it with its columns and tasks', async () => {
      const updatedBoard = {
        ...makeBoard({ name: 'Updated Board' }),
        columns: [],
      };
      vi.mocked(prisma.board.update).mockResolvedValue(
        updatedBoard as unknown as Board,
      );

      const result = await boardService.updateBoard('board-1', {
        name: 'Updated Board',
      });

      expect(result).toEqual(updatedBoard);
    });

    it('requests the board to be updated with ordered columns and tasks', async () => {
      vi.mocked(prisma.board.update).mockResolvedValue(
        makeBoard() as unknown as Board,
      );

      await boardService.updateBoard('board-1', { name: 'Updated Board' });

      expect(prisma.board.update).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        data: { name: 'Updated Board' },
        include: INCLUDE_COLUMNS_WITH_TASKS,
      });
    });
  });

  describe('deleteBoard', () => {
    it('returns true when the board is deleted', async () => {
      vi.mocked(prisma.board.delete).mockResolvedValue(makeBoard());

      const result = await boardService.deleteBoard('board-1');

      expect(result).toBe(true);
      expect(prisma.board.delete).toHaveBeenCalledWith({
        where: { id: 'board-1' },
      });
    });

    it('returns false when the board does not exist', async () => {
      vi.mocked(prisma.board.delete).mockResolvedValue(null as never);

      await expect(boardService.deleteBoard('missing')).resolves.toBe(false);
    });
  });
});
