import { describe, it, expect, vi, beforeEach } from 'vitest';
import { taskService } from './task.service.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/catchError.js';
import type { Task } from '../generated/prisma/client.js';

vi.mock('../config/prisma.js', () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

type TransactionClient = Parameters<typeof prisma.$transaction>[0] extends (
  tx: infer T,
) => unknown
  ? T
  : never;

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Task',
    description: null,
    order: 0,
    columnId: 'column-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('taskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTasksByColumnId', () => {
    it('returns the tasks for the column, ordered ascending', async () => {
      const tasks = [
        makeTask({ id: 't-1', order: 0 }),
        makeTask({ id: 't-2', order: 1000 }),
      ];
      vi.mocked(prisma.task.findMany).mockResolvedValue(tasks);

      const result = await taskService.getTasksByColumnId('column-1');

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { columnId: 'column-1' },
        orderBy: { order: 'asc' },
      });
      expect(result).toEqual(tasks);
    });
  });

  describe('getTaskById', () => {
    it('returns the task when found', async () => {
      const task = makeTask();
      vi.mocked(prisma.task.findUnique).mockResolvedValue(task);

      expect(await taskService.getTaskById('task-1')).toEqual(task);
    });

    it('returns null when the task does not exist', async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

      expect(await taskService.getTaskById('missing')).toBeNull();
    });
  });

  describe('createTask', () => {
    it('places the first task in an empty column at order 0', async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null);
      const created = makeTask({ order: 0 });
      vi.mocked(prisma.task.create).mockResolvedValue(created);

      const result = await taskService.createTask({
        title: 'First task',
        description: null,
        columnId: 'column-1',
      });

      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: { columnId: 'column-1' },
        orderBy: { order: 'desc' },
      });
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: 'First task',
          description: null,
          columnId: 'column-1',
          order: 0,
        },
      });
      expect(result).toEqual(created);
    });

    it('places a new task 1000 after the current last task in the column', async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue(
        makeTask({ order: 2500 }),
      );
      const created = makeTask({ order: 3500 });
      vi.mocked(prisma.task.create).mockResolvedValue(created);

      await taskService.createTask({
        title: 'Second task',
        description: null,
        columnId: 'column-1',
      });

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Second task',
          description: null,
          columnId: 'column-1',
          order: 3500,
        },
      });
    });
  });

  describe('updateTask', () => {
    it('updates the given fields and returns the updated task', async () => {
      const updated = makeTask({ title: 'Renamed' });
      vi.mocked(prisma.task.update).mockResolvedValue(updated);

      const result = await taskService.updateTask('task-1', {
        title: 'Renamed',
      });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { title: 'Renamed' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('computeOrder', () => {
    it('returns the midpoint when both a before and an after order are given', () => {
      expect(taskService.computeOrder(1000, 2000)).toBe(1500);
    });

    it('floors the midpoint when it is not a whole number', () => {
      expect(taskService.computeOrder(1000, 1999)).toBe(1499);
    });

    it('adds the gap to the before order when only a before order is given', () => {
      expect(taskService.computeOrder(1000, null)).toBe(2000);
    });

    it('subtracts the gap from the after order when only an after order is given', () => {
      expect(taskService.computeOrder(null, 1000)).toBe(0);
    });

    it('throws when both before and after are null', () => {
      expect(() => taskService.computeOrder(null, null)).toThrow(AppError);
      expect(() => taskService.computeOrder(null, null)).toThrow(
        'Both before and after cannot be null',
      );
    });
  });

  describe('calculateNewOrder', () => {
    type CalcTx = Parameters<typeof taskService.calculateNewOrder>[0];

    function makeTx(
      findUniqueResults: Array<Task | null> = [],
      findFirstResult: Task | null = null,
    ): CalcTx {
      const findUnique = vi.fn<CalcTx['task']['findUnique']>();
      findUniqueResults.forEach((result) => {
        findUnique.mockResolvedValueOnce(result as never);
      });

      return {
        task: {
          findUnique,
          findFirst: vi
            .fn<CalcTx['task']['findFirst']>()
            .mockResolvedValue(findFirstResult as never),
        },
      } as unknown as CalcTx;
    }

    it('throws "Task not found" when the task being moved does not exist', async () => {
      const tx = makeTx([null]);

      await expect(
        taskService.calculateNewOrder(tx, 'task-1', 'column-1'),
      ).rejects.toMatchObject({ message: 'Task not found', statusCode: 404 });
    });

    it('throws when moving within the same column without a target position', async () => {
      const tx = makeTx([makeTask({ id: 'task-1', columnId: 'column-1' })]);

      await expect(
        taskService.calculateNewOrder(tx, 'task-1', 'column-1'),
      ).rejects.toMatchObject({
        message: 'Cannot move task without specifying a new position',
        statusCode: 400,
      });
    });

    it('throws when beforeTaskId refers to the task being moved', async () => {
      const tx = makeTx([makeTask({ id: 'task-1', columnId: 'column-1' })]);

      await expect(
        taskService.calculateNewOrder(tx, 'task-1', 'column-2', 'task-1'),
      ).rejects.toMatchObject({
        message: 'Cannot move task relative to itself',
        statusCode: 400,
      });
    });

    it('throws when afterTaskId refers to the task being moved', async () => {
      const tx = makeTx([makeTask({ id: 'task-1', columnId: 'column-1' })]);

      await expect(
        taskService.calculateNewOrder(
          tx,
          'task-1',
          'column-2',
          undefined,
          'task-1',
        ),
      ).rejects.toMatchObject({
        message: 'Cannot move task relative to itself',
        statusCode: 400,
      });
    });

    describe('with both beforeTaskId and afterTaskId', () => {
      it('throws "Before task not found" when the before task does not exist', async () => {
        const tx = makeTx([
          makeTask({ id: 'task-1', columnId: 'column-1' }),
          null,
        ]);

        await expect(
          taskService.calculateNewOrder(
            tx,
            'task-1',
            'column-2',
            'before-1',
            'after-1',
          ),
        ).rejects.toMatchObject({
          message: 'Before task not found',
          statusCode: 404,
        });
      });

      it('throws when the before task belongs to a different column', async () => {
        const tx = makeTx([
          makeTask({ id: 'task-1', columnId: 'column-1' }),
          makeTask({ id: 'before-1', columnId: 'other-column', order: 1000 }),
        ]);

        await expect(
          taskService.calculateNewOrder(
            tx,
            'task-1',
            'column-2',
            'before-1',
            'after-1',
          ),
        ).rejects.toMatchObject({
          message: 'Before task does not belong to the target column',
          statusCode: 400,
        });
      });

      it('throws "After task not found" when the after task does not exist', async () => {
        const tx = makeTx([
          makeTask({ id: 'task-1', columnId: 'column-1' }),
          makeTask({ id: 'before-1', columnId: 'column-2', order: 1000 }),
          null,
        ]);

        await expect(
          taskService.calculateNewOrder(
            tx,
            'task-1',
            'column-2',
            'before-1',
            'after-1',
          ),
        ).rejects.toMatchObject({
          message: 'After task not found',
          statusCode: 404,
        });
      });

      it('throws when the after task belongs to a different column', async () => {
        const tx = makeTx([
          makeTask({ id: 'task-1', columnId: 'column-1' }),
          makeTask({ id: 'before-1', columnId: 'column-2', order: 1000 }),
          makeTask({ id: 'after-1', columnId: 'other-column', order: 2000 }),
        ]);

        await expect(
          taskService.calculateNewOrder(
            tx,
            'task-1',
            'column-2',
            'before-1',
            'after-1',
          ),
        ).rejects.toMatchObject({
          message: 'After task does not belong to the target column',
          statusCode: 400,
        });
      });

      it('throws when the before task does not come before the after task', async () => {
        const tx = makeTx([
          makeTask({ id: 'task-1', columnId: 'column-1' }),
          makeTask({ id: 'before-1', columnId: 'column-2', order: 3000 }),
          makeTask({ id: 'after-1', columnId: 'column-2', order: 2000 }),
        ]);

        await expect(
          taskService.calculateNewOrder(
            tx,
            'task-1',
            'column-2',
            'before-1',
            'after-1',
          ),
        ).rejects.toMatchObject({
          message: 'Before task must come before the after task',
          statusCode: 400,
        });
      });

      it('throws when there is no room between the before and after tasks', async () => {
        const tx = makeTx([
          makeTask({ id: 'task-1', columnId: 'column-1' }),
          makeTask({ id: 'before-1', columnId: 'column-2', order: 1000 }),
          makeTask({ id: 'after-1', columnId: 'column-2', order: 1001 }),
        ]);

        await expect(
          taskService.calculateNewOrder(
            tx,
            'task-1',
            'column-2',
            'before-1',
            'after-1',
          ),
        ).rejects.toMatchObject({
          message: 'No space between before and after tasks to move the task',
          statusCode: 400,
        });
      });

      it('returns the midpoint order between the before and after tasks', async () => {
        const tx = makeTx([
          makeTask({ id: 'task-1', columnId: 'column-1' }),
          makeTask({ id: 'before-1', columnId: 'column-2', order: 1000 }),
          makeTask({ id: 'after-1', columnId: 'column-2', order: 2000 }),
        ]);

        const order = await taskService.calculateNewOrder(
          tx,
          'task-1',
          'column-2',
          'before-1',
          'after-1',
        );

        expect(order).toBe(1500);
      });
    });

    describe('with only beforeTaskId', () => {
      it('throws "Before task not found" when it does not exist', async () => {
        const tx = makeTx([
          makeTask({ id: 'task-1', columnId: 'column-1' }),
          null,
        ]);

        await expect(
          taskService.calculateNewOrder(tx, 'task-1', 'column-2', 'before-1'),
        ).rejects.toMatchObject({
          message: 'Before task not found',
          statusCode: 404,
        });
      });

      it('throws when the before task belongs to a different column', async () => {
        const tx = makeTx([
          makeTask({ id: 'task-1', columnId: 'column-1' }),
          makeTask({ id: 'before-1', columnId: 'other-column', order: 1000 }),
        ]);

        await expect(
          taskService.calculateNewOrder(tx, 'task-1', 'column-2', 'before-1'),
        ).rejects.toMatchObject({
          message: 'Before task does not belong to the target column',
          statusCode: 400,
        });
      });

      it('returns beforeTask.order + GAP', async () => {
        const tx = makeTx([
          makeTask({ id: 'task-1', columnId: 'column-1' }),
          makeTask({ id: 'before-1', columnId: 'column-2', order: 1000 }),
        ]);

        const order = await taskService.calculateNewOrder(
          tx,
          'task-1',
          'column-2',
          'before-1',
        );

        expect(order).toBe(2000);
      });
    });

    describe('with only afterTaskId', () => {
      it('throws "After task not found" when it does not exist', async () => {
        const tx = makeTx([
          makeTask({ id: 'task-1', columnId: 'column-1' }),
          null,
        ]);

        await expect(
          taskService.calculateNewOrder(
            tx,
            'task-1',
            'column-2',
            undefined,
            'after-1',
          ),
        ).rejects.toMatchObject({
          message: 'After task not found',
          statusCode: 404,
        });
      });

      it('throws when the after task belongs to a different column', async () => {
        const tx = makeTx([
          makeTask({ id: 'task-1', columnId: 'column-1' }),
          makeTask({ id: 'after-1', columnId: 'other-column', order: 3000 }),
        ]);

        await expect(
          taskService.calculateNewOrder(
            tx,
            'task-1',
            'column-2',
            undefined,
            'after-1',
          ),
        ).rejects.toMatchObject({
          message: 'After task does not belong to the target column',
          statusCode: 400,
        });
      });

      it('returns afterTask.order - GAP', async () => {
        const tx = makeTx([
          makeTask({ id: 'task-1', columnId: 'column-1' }),
          makeTask({ id: 'after-1', columnId: 'column-2', order: 3000 }),
        ]);

        const order = await taskService.calculateNewOrder(
          tx,
          'task-1',
          'column-2',
          undefined,
          'after-1',
        );

        expect(order).toBe(2000);
      });
    });

    describe('with neither beforeTaskId nor afterTaskId (moving to a different, unpositioned spot)', () => {
      it('places the task at order 0 when the target column is empty', async () => {
        const tx = makeTx(
          [makeTask({ id: 'task-1', columnId: 'column-1' })],
          null,
        );

        const order = await taskService.calculateNewOrder(
          tx,
          'task-1',
          'column-2',
        );

        expect(tx.task.findFirst).toHaveBeenCalledWith({
          where: { columnId: 'column-2' },
          orderBy: { order: 'desc' },
        });
        expect(order).toBe(0);
      });

      it('places the task GAP after the current last task in the target column', async () => {
        const tx = makeTx(
          [makeTask({ id: 'task-1', columnId: 'column-1' })],
          makeTask({ id: 'last', columnId: 'column-2', order: 4000 }),
        );

        const order = await taskService.calculateNewOrder(
          tx,
          'task-1',
          'column-2',
        );

        expect(order).toBe(5000);
      });
    });
  });

  describe('moveTask', () => {
    it('updates the task columnId and order via the given transaction client', async () => {
      const updated = makeTask({
        id: 'task-1',
        columnId: 'column-2',
        order: 1500,
      });
      const tx = {
        task: { update: vi.fn().mockResolvedValue(updated) },
      } as unknown as TransactionClient;

      const result = await taskService.moveTask(tx, 'task-1', 'column-2', 1500);

      expect(tx.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { columnId: 'column-2', order: 1500 },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('moveTaskWithOrder', () => {
    it('calculates the new order and moves the task inside a single transaction', async () => {
      const movedTask = makeTask({
        id: 'task-1',
        columnId: 'column-2',
        order: 0,
      });
      const tx = {
        task: {
          findUnique: vi
            .fn()
            .mockResolvedValue(
              makeTask({ id: 'task-1', columnId: 'column-1' }),
            ),
          findFirst: vi.fn().mockResolvedValue(null),
          update: vi.fn().mockResolvedValue(movedTask),
        },
      };
      vi.mocked(prisma.$transaction).mockImplementation(async (cb) =>
        cb(tx as unknown as TransactionClient),
      );

      const result = await taskService.moveTaskWithOrder('task-1', 'column-2');

      expect(tx.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { columnId: 'column-2', order: 0 },
      });
      expect(result).toEqual(movedTask);
    });

    it('moves the task to a specific position between two existing tasks', async () => {
      const movedTask = makeTask({
        id: 'task-1',
        columnId: 'column-2',
        order: 1500,
      });
      const tx = {
        task: {
          findUnique: vi
            .fn()
            .mockResolvedValueOnce(
              makeTask({ id: 'task-1', columnId: 'column-1' }),
            )
            .mockResolvedValueOnce(
              makeTask({ id: 'before-1', columnId: 'column-2', order: 1000 }),
            )
            .mockResolvedValueOnce(
              makeTask({ id: 'after-1', columnId: 'column-2', order: 2000 }),
            ),
          update: vi.fn().mockResolvedValue(movedTask),
        },
      };
      vi.mocked(prisma.$transaction).mockImplementation(async (cb) =>
        cb(tx as unknown as TransactionClient),
      );

      const result = await taskService.moveTaskWithOrder(
        'task-1',
        'column-2',
        'before-1',
        'after-1',
      );

      expect(tx.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { columnId: 'column-2', order: 1500 },
      });
      expect(result).toEqual(movedTask);
    });

    it('propagates a validation error from calculateNewOrder without ever calling update', async () => {
      const tx = {
        task: {
          findUnique: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
        },
      };
      vi.mocked(prisma.$transaction).mockImplementation(async (cb) =>
        cb(tx as unknown as TransactionClient),
      );

      await expect(
        taskService.moveTaskWithOrder('task-1', 'column-2'),
      ).rejects.toMatchObject({ message: 'Task not found', statusCode: 404 });

      expect(tx.task.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('deletes the task by id and returns it', async () => {
      const deleted = makeTask();
      vi.mocked(prisma.task.delete).mockResolvedValue(deleted);

      const result = await taskService.deleteTask('task-1');

      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: 'task-1' },
      });
      expect(result).toEqual(deleted);
    });
  });
});
