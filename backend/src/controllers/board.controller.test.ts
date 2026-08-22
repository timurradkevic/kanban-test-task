import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { boardController } from './board.controller.js';
import { boardService } from '../services/board.service.js';
import type { Board } from '../generated/prisma/client.js';

vi.mock('../services/board.service.js', () => ({
  boardService: {
    getBoardById: vi.fn(),
    createBoard: vi.fn(),
  },
}));

const BOARD_ID = '11111111-1111-4111-8111-111111111111';

function makeBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: BOARD_ID,
    name: 'My Board',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeReq<T = Request>(overrides: Record<string, unknown> = {}): T {
  return {
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as unknown as T;
}

function makeRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

describe('boardController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBoardById', () => {
    it('returns the board as JSON when it exists', async () => {
      const board = makeBoard();
      vi.mocked(boardService.getBoardById).mockResolvedValue(
        board as unknown as never,
      );

      const req = makeReq<Request<{ id: string }>>({
        params: { id: BOARD_ID },
      });
      const res = makeRes();

      await boardController.getBoardById(req, res);

      expect(boardService.getBoardById).toHaveBeenCalledWith(BOARD_ID);
      expect(res.json).toHaveBeenCalledWith(board);
    });

    it('throws a 404 AppError and never responds when the board does not exist', async () => {
      vi.mocked(boardService.getBoardById).mockResolvedValue(
        null as unknown as never,
      );

      const req = makeReq<Request<{ id: string }>>({
        params: { id: BOARD_ID },
      });
      const res = makeRes();

      await expect(
        boardController.getBoardById(req, res),
      ).rejects.toMatchObject({ message: 'Board not found', statusCode: 404 });
      expect(res.json).not.toHaveBeenCalled();
    });

    it('rejects a non-UUID id before calling the service', async () => {
      const req = makeReq<Request<{ id: string }>>({
        params: { id: 'not-a-uuid' },
      });
      const res = makeRes();

      await expect(boardController.getBoardById(req, res)).rejects.toThrow(
        ZodError,
      );
      expect(boardService.getBoardById).not.toHaveBeenCalled();
    });
  });

  describe('createBoard', () => {
    it('creates the board and responds 201 with it', async () => {
      const board = makeBoard({ name: 'New Board' });
      vi.mocked(boardService.createBoard).mockResolvedValue(
        board as unknown as never,
      );

      const req = makeReq({ body: { name: 'New Board' } });
      const res = makeRes();

      await boardController.createBoard(req, res);

      expect(boardService.createBoard).toHaveBeenCalledWith({
        name: 'New Board',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(board);
    });

    it('trims surrounding whitespace from the board name before creating it', async () => {
      vi.mocked(boardService.createBoard).mockResolvedValue(
        makeBoard() as unknown as never,
      );

      const req = makeReq({ body: { name: '  Padded Name  ' } });
      const res = makeRes();

      await boardController.createBoard(req, res);

      expect(boardService.createBoard).toHaveBeenCalledWith({
        name: 'Padded Name',
      });
    });

    it('rejects an empty board name and never calls the service', async () => {
      const req = makeReq({ body: { name: '' } });
      const res = makeRes();

      await expect(boardController.createBoard(req, res)).rejects.toThrow(
        ZodError,
      );
      expect(boardService.createBoard).not.toHaveBeenCalled();
    });

    it('rejects a board name that is only whitespace', async () => {
      const req = makeReq({ body: { name: '   ' } });
      const res = makeRes();

      await expect(boardController.createBoard(req, res)).rejects.toThrow(
        ZodError,
      );
      expect(boardService.createBoard).not.toHaveBeenCalled();
    });

    it('rejects a board name over 255 characters', async () => {
      const req = makeReq({ body: { name: 'a'.repeat(256) } });
      const res = makeRes();

      await expect(boardController.createBoard(req, res)).rejects.toThrow(
        ZodError,
      );
      expect(boardService.createBoard).not.toHaveBeenCalled();
    });

    it('rejects a missing board name', async () => {
      const req = makeReq({ body: {} });
      const res = makeRes();

      await expect(boardController.createBoard(req, res)).rejects.toThrow(
        ZodError,
      );
      expect(boardService.createBoard).not.toHaveBeenCalled();
    });
  });
});
