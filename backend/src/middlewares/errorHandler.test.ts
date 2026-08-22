import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, NextFunction, Response } from 'express';
import { errorHandler } from './errorHandler.js';

vi.mock('../generated/prisma/client.js', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();

  class PrismaClientKnownRequestError extends Error {
    code: string;
    meta?: Record<string, unknown>;
    clientVersion: string;
    constructor(
      message: string,
      opts: {
        code: string;
        clientVersion: string;
        meta?: Record<string, unknown>;
      },
    ) {
      super(message);
      this.name = 'PrismaClientKnownRequestError';
      this.code = opts.code;
      this.clientVersion = opts.clientVersion;
      if (opts.meta !== undefined) {
        this.meta = opts.meta;
      }
    }
  }

  return {
    ...actual,
    Prisma: { PrismaClientKnownRequestError },
  };
});

const { Prisma } = await import('../generated/prisma/client.js');

function makePrismaError(
  code: string,
  meta?: Record<string, unknown>,
  message = 'Prisma error',
) {
  const opts = {
    code,
    clientVersion: '5.0.0',
    ...(meta !== undefined ? { meta } : {}),
  };

  return new Prisma.PrismaClientKnownRequestError(message, opts);
}

function makeReq(): Request {
  return {} as Request;
}

function makeRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  let next: NextFunction;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Prisma known-request errors', () => {
    it('maps a P2025 "record not found" error to 404', () => {
      const req = makeReq();
      const res = makeRes();
      const error = makePrismaError('P2025');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Record not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('maps a P2002 unique constraint violation to 400 with the offending fields', () => {
      const req = makeReq();
      const res = makeRes();
      const error = makePrismaError('P2002', { target: ['name'] });

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unique constraint violation',
        fields: ['name'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('maps a P2002 error without meta.target to 400 with undefined fields', () => {
      const req = makeReq();
      const res = makeRes();
      const error = makePrismaError('P2002');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unique constraint violation',
        fields: undefined,
      });
    });

    it('maps a P2003 foreign key constraint violation to 400 with the offending field name', () => {
      const req = makeReq();
      const res = makeRes();
      const error = makePrismaError('P2003', { field_name: 'columnId' });

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Foreign key constraint violation',
        fields: 'columnId',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('falls back to a generic 400 for a Prisma error code it does not special-case', () => {
      const req = makeReq();
      const res = makeRes();
      const error = makePrismaError('P2014');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Database request error',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('logs the Prisma error details to the console', () => {
      const req = makeReq();
      const res = makeRes();
      const error = makePrismaError(
        'P2025',
        undefined,
        'Record to delete does not exist',
      );

      errorHandler(error, req, res, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'PrismaClientKnownRequestError:',
        'Record to delete does not exist',
        'Code:',
        'P2025',
        'Meta:',
        undefined,
      );
    });
  });

  describe('unexpected errors', () => {
    it('responds 500 with a generic message for a plain Error', () => {
      const req = makeReq();
      const res = makeRes();
      const error = new Error('something exploded internally');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('logs the raw error to the console', () => {
      const req = makeReq();
      const res = makeRes();
      const error = new Error('boom');

      errorHandler(error, req, res, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });

    it('handles a non-Error thrown value the same way', () => {
      const req = makeReq();
      const res = makeRes();

      errorHandler('a plain string error', req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });

    it('never calls next() once the response has been sent', () => {
      const req = makeReq();
      const res = makeRes();
      const error = new Error('boom');

      errorHandler(error, req, res, next);

      expect(next).not.toHaveBeenCalled();
    });
  });
});
