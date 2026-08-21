import { Router } from 'express';
import { boardController } from '../controllers/board.controller.js';

export const boardRouter = Router();

boardRouter.post('/', boardController.createBoard);
