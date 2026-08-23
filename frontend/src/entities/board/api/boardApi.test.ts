import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '@shared/api/api';
import { boardApi } from './boardApi';

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

describe('boardApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getBoard', () => {
    it('sends a GET request to /boards/:boardId', async () => {
      const board = { id: 'b-1', name: 'My Board', columns: [] };
      vi.mocked(fetch).mockReturnValue(jsonResponse(board));

      const store = makeStore();
      await store.dispatch(boardApi.endpoints.getBoard.initiate('b-1'));

      const request = vi.mocked(fetch).mock.calls[0][0] as Request;
      expect(request.url).toContain('/boards/b-1');
      expect(request.method).toBe('GET');
    });

    it('returns the board data on success', async () => {
      const board = { id: 'b-1', name: 'My Board', columns: [] };
      vi.mocked(fetch).mockReturnValue(jsonResponse(board));

      const store = makeStore();
      const result = await store.dispatch(
        boardApi.endpoints.getBoard.initiate('b-1'),
      );

      expect(result.data).toEqual(board);
    });

    it('surfaces an error when the board is not found', async () => {
      vi.mocked(fetch).mockReturnValue(
        jsonResponse({ message: 'Not found' }, false, 404),
      );

      const store = makeStore();
      const result = await store.dispatch(
        boardApi.endpoints.getBoard.initiate('missing'),
      );

      expect(result.error).toMatchObject({ status: 404 });
    });
  });

  describe('createBoard', () => {
    it('sends a POST request to /boards with the board data', async () => {
      const created = {
        id: 'b-2',
        name: 'New board',
        columns: [],
      };
      vi.mocked(fetch).mockReturnValue(jsonResponse(created));

      const store = makeStore();
      await store.dispatch(
        boardApi.endpoints.createBoard.initiate({ name: 'New board' }),
      );

      const request = vi.mocked(fetch).mock.calls[0][0] as Request;
      expect(request.url).toContain('/boards');
      expect(request.method).toBe('POST');
      expect(await request.clone().json()).toEqual({ name: 'New board' });
    });

    it('returns the created board on success', async () => {
      const created = { id: 'b-2', name: 'New board', columns: [] };
      vi.mocked(fetch).mockReturnValue(jsonResponse(created));

      const store = makeStore();
      const result = await store.dispatch(
        boardApi.endpoints.createBoard.initiate({ name: 'New board' }),
      );

      expect(result.data).toEqual(created);
    });
  });
});
