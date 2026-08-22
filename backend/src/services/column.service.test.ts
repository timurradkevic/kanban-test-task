import { describe, it, expect, vi, beforeEach } from 'vitest';
import { columnService } from './column.service.js';
import { prisma } from '../config/prisma.js';
import type { Column } from '../generated/prisma/client.js';

vi.mock('../config/prisma.js', () => ({
  prisma: {
    column: {
      findUnique: vi.fn(),
    },
  },
}));

function makeColumn(overrides: Partial<Column> = {}): Column {
  return {
    id: 'column-1',
    name: 'To Do',
    order: 1,
    boardId: 'board-1',
    type: 'TODO',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Column;
}

describe('columnService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getColumnById', () => {
    it('returns the column when found', async () => {
      const column = makeColumn();
      vi.mocked(prisma.column.findUnique).mockResolvedValue(column);

      expect(await columnService.getColumnById('column-1')).toEqual(column);
    });

    it('returns null when the column does not exist', async () => {
      vi.mocked(prisma.column.findUnique).mockResolvedValue(null);

      expect(await columnService.getColumnById('missing')).toBeNull();
    });

    it('looks the column up by id only, with no relations included', async () => {
      vi.mocked(prisma.column.findUnique).mockResolvedValue(null);

      await columnService.getColumnById('column-1');

      expect(prisma.column.findUnique).toHaveBeenCalledWith({
        where: { id: 'column-1' },
      });
    });
  });
});
