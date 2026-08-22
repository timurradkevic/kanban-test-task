import { baseApi } from '@shared/api/api';
import type { Board } from '@entities/board/model/types';

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
    createBoard: build.mutation<Board, Pick<Board, 'name'>>({
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
