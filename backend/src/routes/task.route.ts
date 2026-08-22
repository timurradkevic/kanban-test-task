import { Router } from 'express';
import { catchError } from '../utils/catchError.js';
import { taskController } from '../controllers/task.controller.js';

export const taskRouter = Router({ mergeParams: true });

taskRouter.post('/', catchError(taskController.createTask));
