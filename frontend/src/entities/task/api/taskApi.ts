import { baseApi } from '@shared/api/api';
import type {
  Task,
  TaskCreateData,
  TaskMoveData,
  TaskUpdateData,
} from '@entities/task';
import { optimisticUpdateTaskPosition } from '@/features/move-task';

export const taskApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
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
    updateTask: build.mutation<
      Task,
      TaskUpdateData & { taskId: string; columnId: string }
    >({
      query: ({ taskId, columnId, ...taskData }) => ({
        url: `/columns/${columnId}/tasks/${taskId}`,
        method: 'PATCH',
        body: taskData,
      }),
      invalidatesTags: ['Board', 'Task'],
    }),
    deleteTask: build.mutation<void, { taskId: string; columnId: string }>({
      query: ({ taskId, columnId }) => ({
        url: `/columns/${columnId}/tasks/${taskId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Board', 'Task'],
    }),
  }),
});

export const {
  useCreateTaskMutation,
  useMoveTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = taskApi;
