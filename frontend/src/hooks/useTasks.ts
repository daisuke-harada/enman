'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, postTasks, patchTask, deleteTask, patchTasksDone, patchTasksCancel, getTaskTemplates } from '@/api-client';
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
    mutationFn: async ({
      title,
      category,
      recurrence_rule_id,
      scheduled_date,
    }: {
      title: string;
      category?: string;
      recurrence_rule_id?: number;
      scheduled_date?: string;
    }) => {
      const { data } = await postTasks({ body: { title, category, recurrence_rule_id, scheduled_date } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY() });
      queryClient.invalidateQueries({ queryKey: TASKS_KEY('pending') });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, title, category }: { taskId: number; title: string; category?: string | null }) => {
      const { data } = await patchTask({ path: { taskId }, body: { title, category: category ?? undefined } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY() });
      queryClient.invalidateQueries({ queryKey: TASKS_KEY('pending') });
      queryClient.invalidateQueries({ queryKey: TASKS_KEY('today_done') });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: number) => {
      await deleteTask({ path: { taskId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY() });
      queryClient.invalidateQueries({ queryKey: TASKS_KEY('pending') });
      queryClient.invalidateQueries({ queryKey: TASKS_KEY('today_done') });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
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
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useCancelTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: number) => {
      const { data } = await patchTasksCancel({ path: { taskId } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
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
