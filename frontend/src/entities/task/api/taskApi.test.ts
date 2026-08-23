import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '@shared/api/api';
import { taskApi } from './taskApi';
import { boardApi } from '@entities/board/api/boardApi';

const makeStore = () =>
  configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

const jsonResponse = (body: unknown, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    clone() {
      return this;
    },
  } as Response);

describe('taskApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('createTask', () => {
    it('sends a POST request to /columns/:columnId/tasks', async () => {
      const created = {
        id: 't-2',
        name: 'New task',
        description: '',
        order: 0,
        columnId: 'c-1',
      };
      vi.mocked(fetch).mockReturnValue(jsonResponse(created));

      const store = makeStore();
      await store.dispatch(
        taskApi.endpoints.createTask.initiate({
          name: 'New task',
          columnId: 'c-1',
        }),
      );

      const request = vi.mocked(fetch).mock.calls[0][0] as Request;
      expect(request.url).toContain('/columns/c-1/tasks');
      expect(request.method).toBe('POST');
    });
  });

  describe('updateTask', () => {
    it('sends a PATCH request to /columns/:columnId/tasks/:taskId', async () => {
      const updated = {
        id: 't-1',
        name: 'Updated',
        description: '',
        order: 0,
        columnId: 'c-1',
      };
      vi.mocked(fetch).mockReturnValue(jsonResponse(updated));

      const store = makeStore();
      await store.dispatch(
        taskApi.endpoints.updateTask.initiate({
          taskId: 't-1',
          columnId: 'c-1',
          name: 'Updated',
        }),
      );

      const request = vi.mocked(fetch).mock.calls[0][0] as Request;
      expect(request.url).toContain('/columns/c-1/tasks/t-1');
      expect(request.method).toBe('PATCH');
    });
  });

  describe('deleteTask', () => {
    it('sends a DELETE request to /columns/:columnId/tasks/:taskId', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse(null));

      const store = makeStore();
      await store.dispatch(
        taskApi.endpoints.deleteTask.initiate({
          taskId: 't-1',
          columnId: 'c-1',
        }),
      );

      const request = vi.mocked(fetch).mock.calls[0][0] as Request;
      expect(request.url).toContain('/columns/c-1/tasks/t-1');
      expect(request.method).toBe('DELETE');
    });
  });

  describe('moveTask', () => {
    it('sends a POST request to the move endpoint with the move payload', async () => {
      const moved = {
        id: 't-1',
        name: 'Task',
        description: null,
        order: 0,
        columnId: 'c-2',
      };
      vi.mocked(fetch).mockReturnValue(jsonResponse(moved));

      const store = makeStore();
      await store.dispatch(
        taskApi.endpoints.moveTask.initiate({
          taskId: 't-1',
          newColumnId: 'c-2',
          previousColumnId: 'c-1',
          boardId: 'b-1',
          afterTaskId: 'after-1',
        }),
      );

      const request = vi.mocked(fetch).mock.calls[0][0] as Request;
      expect(request.url).toContain('/columns/c-1/tasks/t-1/move');
      expect(request.method).toBe('POST');
      expect(await request.clone().json()).toEqual({
        newColumnId: 'c-2',
        afterTaskId: 'after-1',
        beforeTaskId: undefined,
      });
    });

    it('optimistically moves the task in the cached board before the request resolves, and keeps it on success', async () => {
      const board = {
        id: 'b-1',
        name: 'Board',
        columns: [
          {
            id: 'c-1',
            name: 'Todo',
            order: 0,
            type: 'TODO',
            tasks: [
              {
                id: 't-1',
                name: 'Task 1',
                description: null,
                order: 0,
                columnId: 'c-1',
              },
            ],
          },
          {
            id: 'c-2',
            name: 'Done',
            order: 1,
            type: 'DONE',
            tasks: [],
          },
        ],
      };

      let resolveMoveFetch: (value: Response) => void;
      const movePromise = new Promise<Response>((resolve) => {
        resolveMoveFetch = resolve;
      });

      vi.mocked(fetch).mockImplementation((input) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (url.includes('/boards/')) {
          return jsonResponse(board);
        }
        return movePromise;
      });

      const store = makeStore();
      await store.dispatch(boardApi.endpoints.getBoard.initiate('b-1'));

      const moveDispatch = store.dispatch(
        taskApi.endpoints.moveTask.initiate({
          taskId: 't-1',
          newColumnId: 'c-2',
          previousColumnId: 'c-1',
          boardId: 'b-1',
        }),
      );

      // Let the optimistic update apply.
      await Promise.resolve();
      await Promise.resolve();

      const optimisticState = boardApi.endpoints.getBoard.select('b-1')(
        store.getState(),
      );
      expect(optimisticState.data?.columns[0].tasks).toHaveLength(0);
      expect(optimisticState.data?.columns[1].tasks).toHaveLength(1);

      resolveMoveFetch!(
        await jsonResponse({ ...board.columns[0].tasks[0], columnId: 'c-2' }),
      );
      await moveDispatch;

      const finalState = boardApi.endpoints.getBoard.select('b-1')(
        store.getState(),
      );
      expect(finalState.data?.columns[1].tasks).toHaveLength(1);
    });

    it('reverts the optimistic update when the move request fails', async () => {
      const board = {
        id: 'b-1',
        name: 'Board',
        columns: [
          {
            id: 'c-1',
            name: 'Todo',
            order: 0,
            type: 'TODO',
            tasks: [
              {
                id: 't-1',
                name: 'Task 1',
                description: null,
                order: 0,
                columnId: 'c-1',
              },
            ],
          },
          { id: 'c-2', name: 'Done', order: 1, type: 'DONE', tasks: [] },
        ],
      };

      vi.mocked(fetch).mockImplementation((input) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (url.includes('/boards/')) {
          return jsonResponse(board);
        }
        return jsonResponse({ message: 'failed' }, false, 500);
      });

      const store = makeStore();
      await store.dispatch(boardApi.endpoints.getBoard.initiate('b-1'));

      await store.dispatch(
        taskApi.endpoints.moveTask.initiate({
          taskId: 't-1',
          newColumnId: 'c-2',
          previousColumnId: 'c-1',
          boardId: 'b-1',
        }),
      );

      const finalState = boardApi.endpoints.getBoard.select('b-1')(
        store.getState(),
      );
      expect(finalState.data?.columns[0].tasks).toHaveLength(1);
      expect(finalState.data?.columns[1].tasks).toHaveLength(0);
    });
  });
});
