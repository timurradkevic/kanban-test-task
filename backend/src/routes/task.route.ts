import { Router } from 'express';
import { catchError } from '../utils/catchError.js';
import { taskController } from '../controllers/task.controller.js';

export const taskRouter = Router({ mergeParams: true });

taskRouter.get('/', catchError(taskController.getTasksByColumnId));
taskRouter.post('/', catchError(taskController.createTask));
taskRouter.get('/:taskId', catchError(taskController.getTaskById));
taskRouter.patch('/:taskId', catchError(taskController.updateTask));
taskRouter.post('/:taskId/move', catchError(taskController.moveTask));
