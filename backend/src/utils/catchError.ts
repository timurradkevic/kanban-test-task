import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import * as z from 'zod';

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const catchError =
  <P = ParamsDictionary, ResBody = unknown, ReqBody = unknown>(
    fn: RequestHandler<P, ResBody, ReqBody>,
  ) =>
  (
    req: Request<P, ResBody, ReqBody>,
    res: Response<ResBody>,
    next: NextFunction,
  ) => {
    Promise.resolve(fn(req, res, next)).catch((err: unknown) => {
      if (err instanceof z.ZodError) {
        (res as Response)
          .status(400)
          .send({ message: 'Validation error', errors: err.issues });
        return;
      }
      if (err instanceof AppError) {
        (res as Response).status(err.statusCode).send({ message: err.message });
        return;
      }
      next(err);
    });
  };
