'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCalendar,
  getRecurrenceRules,
  postRecurrenceRules,
  patchRecurrenceRules,
  deleteRecurrenceRule,
} from '@/api-client';
import type { RecurrenceRuleRequest } from '@/api-client/types.gen';

export const CALENDAR_KEY = (year: number, month: number) => ['calendar', year, month];
export const RECURRENCE_RULES_KEY = ['recurrence-rules'];

export function useCalendar(year: number, month: number) {
  return useQuery({
    queryKey: CALENDAR_KEY(year, month),
    queryFn: async () => {
      const { data } = await getCalendar({ query: { year, month } });
      return data ?? [];
    },
  });
}

export function useRecurrenceRules() {
  return useQuery({
    queryKey: RECURRENCE_RULES_KEY,
    queryFn: async () => {
      const { data } = await getRecurrenceRules();
      return data ?? [];
    },
  });
}

export function useCreateRecurrenceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: RecurrenceRuleRequest) => {
      const { data } = await postRecurrenceRules({ body });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRENCE_RULES_KEY });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useUpdateRecurrenceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ruleId, body }: { ruleId: number; body: RecurrenceRuleRequest }) => {
      const { data } = await patchRecurrenceRules({ path: { ruleId }, body });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRENCE_RULES_KEY });
    },
  });
}

export function useDeleteRecurrenceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ruleId: number) => {
      await deleteRecurrenceRule({ path: { ruleId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRENCE_RULES_KEY });
    },
  });
}
