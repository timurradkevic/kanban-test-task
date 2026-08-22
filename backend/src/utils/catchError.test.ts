import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import * as z from 'zod';
import { catchError, AppError } from './catchError.js';

function makeReq(): Request {
  return {} as Request;
}

function makeRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.sendStatus = vi.fn().mockReturnValue(res);
  return res;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('AppError', () => {
  it('is an instance of Error and carries the given status code', () => {
    const error = new AppError('oops', 418);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('oops');
    expect(error.statusCode).toBe(418);
  });

  it('defaults the status code to 500 when none is given', () => {
    const error = new AppError('oops');

    expect(error.statusCode).toBe(500);
  });
});

describe('catchError', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('does nothing extra when the wrapped handler resolves successfully', async () => {
    const handler = vi.fn(async (_req: Request, res: Response) => {
      res.status(200).send({ ok: true });
    });
    const req = makeReq();
    const res = makeRes();

    catchError(handler)(req, res, next);
    await flush();

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('maps a ZodError to 400 with a structured validation body', async () => {
    const schema = z.object({ name: z.string().min(2) });
    const result = schema.safeParse({ name: 'a' });
    if (result.success) throw new Error('expected validation to fail');
    const zodError = result.error;

    const handler = vi.fn(async () => {
      throw zodError;
    });
    const req = makeReq();
    const res = makeRes();

    catchError(handler)(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Validation error',
      errors: zodError.issues,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    ['Board not found', 404],
    ['Board name is required', 400],
    ['Something went terribly wrong', 500],
    ['Conflict happened', 409],
  ] as const)(
    'maps an AppError("%s", %i) to a response with that status and message',
    async (message, statusCode) => {
      const handler = vi.fn(async () => {
        throw new AppError(message, statusCode);
      });
      const req = makeReq();
      const res = makeRes();

      catchError(handler)(req, res, next);
      await flush();

      expect(res.status).toHaveBeenCalledWith(statusCode);
      expect(res.send).toHaveBeenCalledWith({ message });
      expect(next).not.toHaveBeenCalled();
    },
  );

  it('defaults an AppError with no explicit status code to a 500 response', async () => {
    const handler = vi.fn(async () => {
      throw new AppError('unexpected');
    });
    const req = makeReq();
    const res = makeRes();

    catchError(handler)(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: 'unexpected' });
  });

  it('falls back to next(err) for an error type it does not recognize', async () => {
    const error = new Error('totally unexpected');
    const handler = vi.fn(async () => {
      throw error;
    });
    const req = makeReq();
    const res = makeRes();

    catchError(handler)(req, res, next);
    await flush();

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it('forwards a Prisma-style error to next() rather than mapping it, leaving that to errorHandler.ts', async () => {
    class FakePrismaError extends Error {
      code = 'P2002';
    }
    const error = new FakePrismaError('unique constraint');
    const handler = vi.fn(async () => {
      throw error;
    });
    const req = makeReq();
    const res = makeRes();

    catchError(handler)(req, res, next);
    await flush();

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('handles a rejected-promise-returning (non-async) handler the same as an async one', async () => {
    const handler = vi.fn(
      (_req: Request, _res: Response, _next: NextFunction) =>
        Promise.reject(new AppError('not there', 404)),
    );
    const req = makeReq();
    const res = makeRes();

    catchError(handler)(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ message: 'not there' });
  });

  it('only responds once, via sendStatus, when the handler resolves without throwing', async () => {
    const handler = vi.fn(async (_req: Request, res: Response) => {
      res.sendStatus?.(204);
    });
    const req = makeReq();
    const res = makeRes();

    catchError(handler)(req, res, next);
    await flush();

    expect(res.sendStatus).toHaveBeenCalledWith(204);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('does not catch a synchronous throw from a non-async handler — it propagates out of the wrapper', () => {
    const handler = vi.fn(() => {
      throw new AppError('thrown synchronously', 400);
    }) as unknown as (req: Request, res: Response, next: NextFunction) => void;
    const req = makeReq();
    const res = makeRes();

    expect(() => catchError(handler)(req, res, next)).toThrow(
      'thrown synchronously',
    );

    expect(res.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
