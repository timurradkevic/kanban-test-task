import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { taskController } from './task.controller.js';
import { taskService } from '../services/task.service.js';
import { columnService } from '../services/column.service.js';
import type { Column, Task } from '../generated/prisma/client.js';

vi.mock('../services/task.service.js', () => ({
  taskService: {
    getTasksByColumnId: vi.fn(),
    getTaskById: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    moveTaskWithOrder: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

vi.mock('../services/column.service.js', () => ({
  columnService: {
    getColumnById: vi.fn(),
  },
}));

const COLUMN_ID = '22222222-2222-4222-8222-222222222222';
const NEW_COLUMN_ID = '66666666-6666-4666-8666-666666666666';
const TASK_ID = '33333333-3333-4333-8333-333333333333';
const BEFORE_TASK_ID = '44444444-4444-4444-8444-444444444444';
const AFTER_TASK_ID = '55555555-5555-4555-8555-555555555555';

function makeColumn(overrides: Partial<Column> = {}): Column {
  return {
    id: COLUMN_ID,
    name: 'To Do',
    order: 1,
    boardId: 'board-1',
    type: 'TODO',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Column;
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: TASK_ID,
    title: 'Task',
    description: null,
    order: 0,
    columnId: COLUMN_ID,
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
  res.sendStatus = vi.fn().mockReturnValue(res);
  return res;
}

describe('taskController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTasksByColumnId', () => {
    it('returns the tasks for an existing column', async () => {
      vi.mocked(columnService.getColumnById).mockResolvedValue(
        makeColumn() as unknown as never,
      );
      const tasks = [makeTask()];
      vi.mocked(taskService.getTasksByColumnId).mockResolvedValue(tasks);

      const req = makeReq<Request<{ columnId: string }>>({
        params: { columnId: COLUMN_ID },
      });
      const res = makeRes();

      await taskController.getTasksByColumnId(req, res);

      expect(columnService.getColumnById).toHaveBeenCalledWith(COLUMN_ID);
      expect(taskService.getTasksByColumnId).toHaveBeenCalledWith(COLUMN_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(tasks);
    });

    it('throws a 404 AppError and never lists tasks when the column does not exist', async () => {
      vi.mocked(columnService.getColumnById).mockResolvedValue(
        null as unknown as never,
      );

      const req = makeReq<Request<{ columnId: string }>>({
        params: { columnId: COLUMN_ID },
      });
      const res = makeRes();

      await expect(
        taskController.getTasksByColumnId(req, res),
      ).rejects.toMatchObject({
        message: 'Column not found',
        statusCode: 404,
      });
      expect(taskService.getTasksByColumnId).not.toHaveBeenCalled();
    });

    it('rejects a non-UUID columnId before touching either service', async () => {
      const req = makeReq<Request<{ columnId: string }>>({
        params: { columnId: 'not-a-uuid' },
      });
      const res = makeRes();

      await expect(taskController.getTasksByColumnId(req, res)).rejects.toThrow(
        ZodError,
      );
      expect(columnService.getColumnById).not.toHaveBeenCalled();
      expect(taskService.getTasksByColumnId).not.toHaveBeenCalled();
    });
  });

  describe('getTaskById', () => {
    it('returns the task when it exists', async () => {
      const task = makeTask();
      vi.mocked(taskService.getTaskById).mockResolvedValue(task);

      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: TASK_ID },
      });
      const res = makeRes();

      await taskController.getTaskById(req, res);

      expect(taskService.getTaskById).toHaveBeenCalledWith(TASK_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(task);
    });

    it('throws a 404 AppError when the task does not exist', async () => {
      vi.mocked(taskService.getTaskById).mockResolvedValue(null);

      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: TASK_ID },
      });
      const res = makeRes();

      await expect(taskController.getTaskById(req, res)).rejects.toMatchObject({
        message: 'Task not found',
        statusCode: 404,
      });
    });

    it('rejects a non-UUID taskId', async () => {
      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: 'nope' },
      });
      const res = makeRes();

      await expect(taskController.getTaskById(req, res)).rejects.toThrow(
        ZodError,
      );
      expect(taskService.getTaskById).not.toHaveBeenCalled();
    });
  });

  describe('createTask', () => {
    it('creates the task in an existing column and responds 201', async () => {
      vi.mocked(columnService.getColumnById).mockResolvedValue(
        makeColumn() as unknown as never,
      );
      const task = makeTask({ title: 'New task' });
      vi.mocked(taskService.createTask).mockResolvedValue(task);

      const req = makeReq<Request<{ columnId: string }>>({
        params: { columnId: COLUMN_ID },
        body: { title: 'New task', description: 'Some details' },
      });
      const res = makeRes();

      await taskController.createTask(req, res);

      expect(taskService.createTask).toHaveBeenCalledWith({
        title: 'New task',
        description: 'Some details',
        columnId: COLUMN_ID,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(task);
    });

    it('defaults a missing description to null', async () => {
      vi.mocked(columnService.getColumnById).mockResolvedValue(
        makeColumn() as unknown as never,
      );
      vi.mocked(taskService.createTask).mockResolvedValue(makeTask());

      const req = makeReq<Request<{ columnId: string }>>({
        params: { columnId: COLUMN_ID },
        body: { title: 'New task' },
      });
      const res = makeRes();

      await taskController.createTask(req, res);

      expect(taskService.createTask).toHaveBeenCalledWith({
        title: 'New task',
        description: null,
        columnId: COLUMN_ID,
      });
    });

    it('throws a 404 AppError and never creates the task when the column does not exist', async () => {
      vi.mocked(columnService.getColumnById).mockResolvedValue(
        null as unknown as never,
      );

      const req = makeReq<Request<{ columnId: string }>>({
        params: { columnId: COLUMN_ID },
        body: { title: 'New task' },
      });
      const res = makeRes();

      await expect(taskController.createTask(req, res)).rejects.toMatchObject({
        message: 'Column not found',
        statusCode: 404,
      });
      expect(taskService.createTask).not.toHaveBeenCalled();
    });

    it('rejects an empty title and never calls the column or task service', async () => {
      const req = makeReq<Request<{ columnId: string }>>({
        params: { columnId: COLUMN_ID },
        body: { title: '' },
      });
      const res = makeRes();

      await expect(taskController.createTask(req, res)).rejects.toThrow(
        ZodError,
      );
      expect(columnService.getColumnById).not.toHaveBeenCalled();
      expect(taskService.createTask).not.toHaveBeenCalled();
    });

    it('rejects a missing title', async () => {
      const req = makeReq<Request<{ columnId: string }>>({
        params: { columnId: COLUMN_ID },
        body: {},
      });
      const res = makeRes();

      await expect(taskController.createTask(req, res)).rejects.toThrow(
        ZodError,
      );
      expect(taskService.createTask).not.toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('updates the title and returns the updated task', async () => {
      const updated = makeTask({ title: 'Renamed' });
      vi.mocked(taskService.updateTask).mockResolvedValue(updated);

      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: TASK_ID },
        body: { title: 'Renamed' },
      });
      const res = makeRes();

      await taskController.updateTask(req, res);

      expect(taskService.updateTask).toHaveBeenCalledWith(TASK_ID, {
        title: 'Renamed',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('includes description in the update payload only when explicitly provided', async () => {
      vi.mocked(taskService.updateTask).mockResolvedValue(makeTask());

      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: TASK_ID },
        body: { title: 'Renamed', description: 'Updated details' },
      });
      const res = makeRes();

      await taskController.updateTask(req, res);

      expect(taskService.updateTask).toHaveBeenCalledWith(TASK_ID, {
        title: 'Renamed',
        description: 'Updated details',
      });
    });

    it('omits description from the update payload when the body has neither field', async () => {
      vi.mocked(taskService.updateTask).mockResolvedValue(makeTask());

      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: TASK_ID },
        body: {},
      });
      const res = makeRes();

      await taskController.updateTask(req, res);

      expect(taskService.updateTask).toHaveBeenCalledWith(TASK_ID, {
        title: undefined,
      });
    });

    it('rejects an empty title string', async () => {
      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: TASK_ID },
        body: { title: '' },
      });
      const res = makeRes();

      await expect(taskController.updateTask(req, res)).rejects.toThrow(
        ZodError,
      );
      expect(taskService.updateTask).not.toHaveBeenCalled();
    });

    it('rejects a non-UUID taskId', async () => {
      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: 'nope' },
        body: { title: 'Renamed' },
      });
      const res = makeRes();

      await expect(taskController.updateTask(req, res)).rejects.toThrow(
        ZodError,
      );
      expect(taskService.updateTask).not.toHaveBeenCalled();
    });
  });

  describe('moveTask', () => {
    it('moves the task into an existing column and responds with the updated task', async () => {
      vi.mocked(columnService.getColumnById).mockResolvedValue(
        makeColumn({ id: NEW_COLUMN_ID }) as unknown as never,
      );
      const moved = makeTask({ columnId: NEW_COLUMN_ID, order: 500 });
      vi.mocked(taskService.moveTaskWithOrder).mockResolvedValue(moved);

      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: TASK_ID },
        body: {
          newColumnId: NEW_COLUMN_ID,
          beforeTaskId: BEFORE_TASK_ID,
          afterTaskId: AFTER_TASK_ID,
        },
      });
      const res = makeRes();

      await taskController.moveTask(req, res);

      expect(columnService.getColumnById).toHaveBeenCalledWith(NEW_COLUMN_ID);
      expect(taskService.moveTaskWithOrder).toHaveBeenCalledWith(
        TASK_ID,
        NEW_COLUMN_ID,
        BEFORE_TASK_ID,
        AFTER_TASK_ID,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(moved);
    });

    it('moves the task with only a target column and no before/after position', async () => {
      vi.mocked(columnService.getColumnById).mockResolvedValue(
        makeColumn({ id: NEW_COLUMN_ID }) as unknown as never,
      );
      vi.mocked(taskService.moveTaskWithOrder).mockResolvedValue(makeTask());

      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: TASK_ID },
        body: { newColumnId: NEW_COLUMN_ID },
      });
      const res = makeRes();

      await taskController.moveTask(req, res);

      expect(taskService.moveTaskWithOrder).toHaveBeenCalledWith(
        TASK_ID,
        NEW_COLUMN_ID,
        undefined,
        undefined,
      );
    });

    it('throws a 404 AppError and never moves the task when the target column does not exist', async () => {
      vi.mocked(columnService.getColumnById).mockResolvedValue(
        null as unknown as never,
      );

      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: TASK_ID },
        body: { newColumnId: NEW_COLUMN_ID },
      });
      const res = makeRes();

      await expect(taskController.moveTask(req, res)).rejects.toMatchObject({
        message: 'Column not found',
        statusCode: 404,
      });
      expect(taskService.moveTaskWithOrder).not.toHaveBeenCalled();
    });

    it('rejects a non-UUID newColumnId before checking the column', async () => {
      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: TASK_ID },
        body: { newColumnId: 'nope' },
      });
      const res = makeRes();

      await expect(taskController.moveTask(req, res)).rejects.toThrow(ZodError);
      expect(columnService.getColumnById).not.toHaveBeenCalled();
      expect(taskService.moveTaskWithOrder).not.toHaveBeenCalled();
    });

    it('rejects a non-UUID beforeTaskId', async () => {
      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: TASK_ID },
        body: { newColumnId: NEW_COLUMN_ID, beforeTaskId: 'nope' },
      });
      const res = makeRes();

      await expect(taskController.moveTask(req, res)).rejects.toThrow(ZodError);
      expect(columnService.getColumnById).not.toHaveBeenCalled();
    });

    it('rejects a non-UUID taskId param', async () => {
      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: 'nope' },
        body: { newColumnId: NEW_COLUMN_ID },
      });
      const res = makeRes();

      await expect(taskController.moveTask(req, res)).rejects.toThrow(ZodError);
      expect(columnService.getColumnById).not.toHaveBeenCalled();
      expect(taskService.moveTaskWithOrder).not.toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('deletes the task and responds 204', async () => {
      vi.mocked(taskService.deleteTask).mockResolvedValue(makeTask());

      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: TASK_ID },
      });
      const res = makeRes();

      await taskController.deleteTask(req, res);

      expect(taskService.deleteTask).toHaveBeenCalledWith(TASK_ID);
      expect(res.sendStatus).toHaveBeenCalledWith(204);
    });

    it('rejects a non-UUID taskId and never calls the service', async () => {
      const req = makeReq<Request<{ taskId: string }>>({
        params: { taskId: 'nope' },
      });
      const res = makeRes();

      await expect(taskController.deleteTask(req, res)).rejects.toThrow(
        ZodError,
      );
      expect(taskService.deleteTask).not.toHaveBeenCalled();
    });
  });
});
