import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../generated/prisma/client.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(
      'PrismaClientKnownRequestError:',
      err.message,
      'Code:',
      err.code,
      'Meta:',
      err.meta,
    );

    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Record not found' });
      return;
    }
    if (err.code === 'P2002') {
      res.status(400).json({
        message: 'Unique constraint violation',
        fields: err.meta?.target,
      });
      return;
    }
    if (err.code === 'P2003') {
      res.status(400).json({
        message: 'Foreign key constraint violation',
        fields: err.meta?.field_name,
      });
      return;
    }
    res.status(400).json({ message: 'Database request error' });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}
