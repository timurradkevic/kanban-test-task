import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../generated/prisma/client.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if ((err as Prisma.PrismaClientKnownRequestError).code === 'P2025') {
      res.status(404).json({ message: 'Record not found' });
      return;
    }
    res.status(400).json({ message: 'Database request error' });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}
