import { Request, Response } from 'express';
import { boardService } from '../services/board.service.js';
import { AppError } from '../middlewares/errorHandler.js';
import { z } from 'zod';

const BoardData = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Board name is required' })
    .max(255, { message: 'Board name must be less than 255 characters' }),
});

export const boardController = {
  createBoard: async (req: Request, res: Response) => {
    const boardData = BoardData.safeParse(req.body);

    if (!boardData.success) {
      throw new AppError(boardData.error.issues[0].message, 400);
    }

    const { name } = boardData.data;

    const board = await boardService.createBoard({ name });

    res.status(201).json(board);
  },
};
