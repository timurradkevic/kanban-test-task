import { Request, Response } from 'express';
import { boardService } from '../services/board.service.js';
import { AppError } from '../middlewares/errorHandler.js';
import * as z from 'zod';

const BoardData = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Board name is required' })
    .max(255, { message: 'Board name must be less than 255 characters' }),
});
const BoardIdParam = z.object({
  id: z.string().uuid({ message: 'Invalid board ID' }),
});

export const boardController = {
  getBoardById: async (req: Request, res: Response) => {
    const { id } = BoardIdParam.parse(req.params);

    const board = await boardService.getBoardById(id);

    if (!board) {
      throw new AppError('Board not found', 404);
    }

    res.json(board);
  },
  createBoard: async (req: Request, res: Response) => {
    const { name } = BoardData.parse(req.body);

    const board = await boardService.createBoard({ name });

    res.status(201).json(board);
  },
};
