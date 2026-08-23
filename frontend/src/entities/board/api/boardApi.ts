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
    updateBoard: build.mutation<
      Board,
      { boardId: string; data: Partial<Board> }
    >({
      query: ({ boardId, data }) => ({
        url: `/boards/${boardId}`,
        method: 'PATCH',
        body: data,
      }),
      async onQueryStarted({ boardId, data }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoard', boardId, (draft) => {
            Object.assign(draft, data);
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    deleteBoard: build.mutation<void, string>({
      query: (boardId) => ({
        url: `/boards/${boardId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, boardId) => [
        { type: 'Board', id: boardId },
      ],
    }),
  }),
});

export const {
  useGetBoardQuery,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
} = boardApi;
