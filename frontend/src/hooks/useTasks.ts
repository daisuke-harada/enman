'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, postTasks, patchTasksDone, getTaskTemplates } from '@/api-client';
import type { GetTasksData } from '@/api-client/types.gen';

export const TASKS_KEY = (status?: string) => ['tasks', status ?? 'all'];
export const TASK_TEMPLATES_KEY = ['task-templates'];

export function useTasks(status?: NonNullable<GetTasksData['query']>['status']) {
  return useQuery({
    queryKey: TASKS_KEY(status),
    queryFn: async () => {
      const { data } = await getTasks({ query: status ? { status } : undefined });
      return data ?? [];
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, category }: { title: string; category?: string }) => {
      const { data } = await postTasks({ body: { title, category } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY() });
      queryClient.invalidateQueries({ queryKey: TASKS_KEY('pending') });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: number) => {
      const { data } = await patchTasksDone({ path: { taskId } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY() });
      queryClient.invalidateQueries({ queryKey: TASKS_KEY('pending') });
      queryClient.invalidateQueries({ queryKey: TASKS_KEY('today_done') });
    },
  });
}

export function useTaskTemplates() {
  return useQuery({
    queryKey: TASK_TEMPLATES_KEY,
    queryFn: async () => {
      const { data } = await getTaskTemplates();
      return data ?? [];
    },
  });
}
