import { Request, Response } from 'express';
import { taskService } from '../services/task.service.js';
import * as z from 'zod';
import { columnService } from '../services/column.service.js';
import { AppError } from '../utils/catchError.js';

const TaskData = z.object({
  title: z.string().trim().min(1, { message: 'Task title is required' }),
  description: z.string().optional(),
});

const TaskParams = z.object({
  columnId: z.uuid({ message: 'Invalid column ID' }),
});

export const taskController = {
  async createTask(req: Request, res: Response) {
    const { title, description } = TaskData.parse(req.body);
    const { columnId } = TaskParams.parse(req.params);
    const column = await columnService.getColumnById(columnId);
    if (!column) {
      throw new AppError('Column not found', 404);
    }

    const task = await taskService.createTask({
      title,
      description: description ?? null,
      columnId,
    });

    res.status(201).json(task);
  },
};
