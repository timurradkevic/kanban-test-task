import { Request, Response } from 'express';
import { taskService } from '../services/task.service.js';
import * as z from 'zod';
import { columnService } from '../services/column.service.js';
import { AppError } from '../utils/catchError.js';

const TaskData = z.object({
  name: z.string().trim().min(1, { message: 'Task name is required' }),
  description: z.string().optional(),
});

const TaskParams = z.object({
  columnId: z.uuid({ message: 'Invalid column ID' }),
});

const TaskIdParam = z.object({
  taskId: z.uuid({ message: 'Invalid task ID' }),
});

const TaskUpdateData = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Task name is required' })
    .optional(),
  description: z.string().optional(),
});

const TaskMoveData = z.object({
  newColumnId: z.uuid({ message: 'Invalid column ID' }),
  afterTaskId: z.uuid({ message: 'Invalid after task ID' }).optional(),
  beforeTaskId: z.uuid({ message: 'Invalid before task ID' }).optional(),
});

export const taskController = {
  async getTasksByColumnId(req: Request, res: Response) {
    const { columnId } = TaskParams.parse(req.params);
    const column = await columnService.getColumnById(columnId);
    if (!column) {
      throw new AppError('Column not found', 404);
    }

    const tasks = await taskService.getTasksByColumnId(columnId);
    res.status(200).json(tasks);
  },
  async getTaskById(req: Request, res: Response) {
    const { taskId } = TaskIdParam.parse(req.params);
    const task = await taskService.getTaskById(taskId);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    res.status(200).json(task);
  },
  async createTask(req: Request, res: Response) {
    const { name, description } = TaskData.parse(req.body);
    const { columnId } = TaskParams.parse(req.params);
    const column = await columnService.getColumnById(columnId);
    if (!column) {
      throw new AppError('Column not found', 404);
    }

    const task = await taskService.createTask({
      name,
      description: description ?? null,
      columnId,
    });

    res.status(201).json(task);
  },
  async updateTask(req: Request, res: Response) {
    const { taskId } = TaskIdParam.parse(req.params);
    const { name, description } = TaskUpdateData.parse(req.body);

    const task = await taskService.updateTask(taskId, {
      name,
      ...(description !== undefined ? { description } : {}),
    });

    res.status(200).json(task);
  },
  async moveTask(req: Request, res: Response) {
    const { taskId } = TaskIdParam.parse(req.params);
    const { newColumnId, afterTaskId, beforeTaskId } = TaskMoveData.parse(
      req.body,
    );

    const column = await columnService.getColumnById(newColumnId);
    if (!column) {
      throw new AppError('Column not found', 404);
    }

    const updatedTask = await taskService.moveTaskWithOrder(
      taskId,
      newColumnId,
      beforeTaskId,
      afterTaskId,
    );

    res.status(200).json(updatedTask);
  },
  async deleteTask(req: Request, res: Response) {
    const { taskId } = TaskIdParam.parse(req.params);

    await taskService.deleteTask(taskId);

    res.sendStatus(204);
  },
};
