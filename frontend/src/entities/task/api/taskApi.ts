import { baseApi } from '@shared/api/api';
import type { Task, TaskCreateData, TaskMoveData } from '@entities/task';
import { optimisticUpdateTaskPosition } from '@/features/move-task';

export const taskApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTask: build.query<Task, string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, taskId) => [{ type: 'Task', id: taskId }],
    }),
    createTask: build.mutation<Task, TaskCreateData>({
      query: (taskData) => ({
        url: `/columns/${taskData.columnId}/tasks`,
        method: 'POST',
        body: taskData,
      }),
      invalidatesTags: ['Board'],
    }),
    moveTask: build.mutation<
      Task,
      TaskMoveData & {
        taskId: string;
        boardId: string;
        previousColumnId: string;
      }
    >({
      query: ({
        taskId,
        newColumnId,
        afterTaskId,
        beforeTaskId,
        previousColumnId,
      }) => ({
        url: `/columns/${previousColumnId}/tasks/${taskId}/move`,
        method: 'POST',
        body: { newColumnId, afterTaskId, beforeTaskId },
      }),
      async onQueryStarted(
        {
          taskId,
          boardId,
          newColumnId,
          beforeTaskId,
          afterTaskId,
          previousColumnId,
        },
        { dispatch, queryFulfilled },
      ) {
        await optimisticUpdateTaskPosition(dispatch, {
          taskId,
          newColumnId,
          beforeTaskId,
          afterTaskId,
          boardId,
          previousColumnId,
          queryFulfilled,
        });
      },
    }),
  }),
});

export const { useGetTaskQuery, useCreateTaskMutation, useMoveTaskMutation } =
  taskApi;
