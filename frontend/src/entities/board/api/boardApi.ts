import { baseApi } from '@shared/api/api';
import type { Board } from '@entities/board/model/types';

export const boardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBoard: build.query<Board, string>({
      query: (id) => ({
        url: `/boards/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Board', id }],
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
