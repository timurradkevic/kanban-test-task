import { baseApi } from '@shared/api/api';
import type { Task, TaskCreateData } from '@entities/task';

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
  }),
});

export const { useGetTaskQuery, useCreateTaskMutation } = taskApi;
