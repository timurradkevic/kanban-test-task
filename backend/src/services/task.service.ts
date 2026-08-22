import { prisma } from '../config/prisma.js';
import type { Prisma, Task } from '../generated/prisma/client.js';
import { AppError } from '../utils/catchError.js';

type TaskData = Pick<Task, 'title' | 'description' | 'columnId'>;
type TaskUpdateData = Partial<Pick<Task, 'title' | 'description'>>;

const GAP = 1000;

const assertIsValidAfterId = async (
  tx: Prisma.TransactionClient,
  columnId: string,
  afterTaskId: string,
) => {
  const afterTask = await tx.task.findUnique({
    where: { id: afterTaskId },
  });
  if (!afterTask) {
    throw new AppError('After task not found', 404);
  }
  if (afterTask.columnId !== columnId) {
    throw new AppError('After task does not belong to the target column', 400);
  }
  return afterTask;
};

const assertIsValidBeforeId = async (
  tx: Prisma.TransactionClient,
  columnId: string,
  beforeTaskId: string,
) => {
  const beforeTask = await tx.task.findUnique({
    where: { id: beforeTaskId },
  });
  if (!beforeTask) {
    throw new AppError('Before task not found', 404);
  }
  if (beforeTask.columnId !== columnId) {
    throw new AppError('Before task does not belong to the target column', 400);
  }
  return beforeTask;
};

export const taskService = {
  async getTasksByColumnId(columnId: string) {
    return await prisma.task.findMany({
      where: { columnId },
      orderBy: { order: 'asc' },
    });
  },
  async getTaskById(taskId: string) {
    return await prisma.task.findUnique({
      where: { id: taskId },
    });
  },
  async createTask(taskData: TaskData) {
    const lastTask = await prisma.task.findFirst({
      where: { columnId: taskData.columnId },
      orderBy: { order: 'desc' },
    });

    const task = await prisma.task.create({
      data: {
        ...taskData,
        order: lastTask ? lastTask.order + GAP : 0,
      },
    });
    return task;
  },
  async updateTask(taskId: string, taskData: TaskUpdateData) {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: taskData,
    });
    return task;
  },
  async moveTask(
    tx: Prisma.TransactionClient,
    taskId: string,
    newColumnId: string,
    newOrder: number,
  ) {
    const task = await tx.task.update({
      where: { id: taskId },
      data: {
        columnId: newColumnId,
        order: newOrder,
      },
    });
    return task;
  },
  computeOrder(before: number | null, after: number | null) {
    if (before !== null && after !== null) {
      return Math.floor((before + after) / 2);
    } else if (before !== null) {
      return before + GAP;
    } else if (after !== null) {
      return after - GAP;
    } else {
      throw new AppError('Both before and after cannot be null', 400);
    }
  },
  async calculateNewOrder(
    tx: Prisma.TransactionClient,
    taskId: string,
    columnId: string,
    beforeTaskId?: string,
    afterTaskId?: string,
  ) {
    const task = await tx.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }
    if (task.columnId === columnId && !beforeTaskId && !afterTaskId) {
      throw new AppError(
        'Cannot move task without specifying a new position',
        400,
      );
    }
    if (beforeTaskId === taskId || afterTaskId === taskId) {
      throw new AppError('Cannot move task relative to itself', 400);
    }

    if (beforeTaskId && afterTaskId) {
      const beforeTask = await assertIsValidBeforeId(
        tx,
        columnId,
        beforeTaskId,
      );
      const afterTask = await assertIsValidAfterId(tx, columnId, afterTaskId);

      if (beforeTask.order >= afterTask.order) {
        throw new AppError('Before task must come before the after task', 400);
      }
      if (afterTask.order - beforeTask.order < 2) {
        throw new AppError(
          'No space between before and after tasks to move the task',
          400,
        );
      }

      return taskService.computeOrder(beforeTask.order, afterTask.order);
    } else if (beforeTaskId) {
      const beforeTask = await assertIsValidBeforeId(
        tx,
        columnId,
        beforeTaskId,
      );

      return taskService.computeOrder(beforeTask.order, null);
    } else if (afterTaskId) {
      const afterTask = await assertIsValidAfterId(tx, columnId, afterTaskId);

      return taskService.computeOrder(null, afterTask.order);
    } else {
      const lastTask = await tx.task.findFirst({
        where: { columnId: columnId },
        orderBy: { order: 'desc' },
      });
      return lastTask ? lastTask.order + GAP : 0;
    }
  },
  async moveTaskWithOrder(
    taskId: string,
    newColumnId: string,
    beforeTaskId?: string,
    afterTaskId?: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      const newOrder = await taskService.calculateNewOrder(
        tx,
        taskId,
        newColumnId,
        beforeTaskId,
        afterTaskId,
      );
      return await taskService.moveTask(tx, taskId, newColumnId, newOrder);
    });
  },
  async deleteTask(taskId: string) {
    const task = await prisma.task.delete({
      where: { id: taskId },
    });
    return task;
  },
};
