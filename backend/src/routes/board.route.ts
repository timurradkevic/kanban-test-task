import { Router } from 'express';
import { boardController } from '../controllers/board.controller.js';
import { catchError } from '../utils/catchError.js';

export const boardRouter = Router();

boardRouter.post('/', catchError(boardController.createBoard));
boardRouter.get('/:id', catchError(boardController.getBoardById));
boardRouter.patch('/:id', catchError(boardController.updateBoard));
boardRouter.delete('/:id', catchError(boardController.deleteBoard));
