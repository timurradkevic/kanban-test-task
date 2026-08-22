import { prisma } from '../config/prisma.js';
import type { Task } from '../generated/prisma/client.js';

type TaskData = Pick<Task, 'title' | 'description' | 'columnId'>;

export const taskService = {
  async createTask(taskData: TaskData) {
    const lastTask = await prisma.task.findFirst({
      where: { columnId: taskData.columnId },
      orderBy: { order: 'desc' },
    });

    const task = await prisma.task.create({
      data: {
        ...taskData,
        order: lastTask ? lastTask.order + 1 : 0,
      },
    });
    return task;
  },
};
