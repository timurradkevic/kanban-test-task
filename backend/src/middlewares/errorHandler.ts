import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../generated/prisma/client.js';

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if ((err as Prisma.PrismaClientKnownRequestError).code === 'P2025') {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    res.status(400).json({ error: 'Database request error' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
