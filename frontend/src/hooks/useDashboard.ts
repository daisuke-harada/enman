'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStatsContributions, getFamilyTimeline, getFamiliesGoals, postFamiliesGoals } from '@/api-client';
import type { CreateFamilyGoalRequest } from '@/api-client/types.gen';

export const CONTRIBUTIONS_KEY = ['stats', 'contributions'];
export const TIMELINE_KEY = ['family', 'timeline'];
export const GOALS_KEY = ['families', 'goals'];

export function useContributions() {
  return useQuery({
    queryKey: CONTRIBUTIONS_KEY,
    queryFn: async () => {
      const { data } = await getStatsContributions();
      return data ?? [];
    },
  });
}

export function useFamilyTimeline() {
  return useQuery({
    queryKey: TIMELINE_KEY,
    queryFn: async () => {
      const { data } = await getFamilyTimeline();
      return data ?? [];
    },
  });
}

export function useFamilyGoals() {
  return useQuery({
    queryKey: GOALS_KEY,
    queryFn: async () => {
      const { data } = await getFamiliesGoals();
      return data ?? [];
    },
  });
}

export function useCreateFamilyGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateFamilyGoalRequest) => {
      const { data } = await postFamiliesGoals({ body });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_KEY });
    },
  });
}
