import { baseApi } from '@shared/api/api';
import type { Board, BoardCreateData } from '@entities/board';

export const boardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBoard: build.query<Board, string>({
      query: (boardId) => ({
        url: `/boards/${boardId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, boardId) => [
        { type: 'Board', id: boardId },
      ],
    }),
    createBoard: build.mutation<Board, BoardCreateData>({
      query: (boardData) => ({
        url: '/boards',
        method: 'POST',
        body: boardData,
      }),
      invalidatesTags: ['Board'],
    }),
  }),
});

export const { useGetBoardQuery, useCreateBoardMutation } = boardApi;
