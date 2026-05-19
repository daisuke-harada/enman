'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postTasksAppreciation, getNotifications } from '@/api-client';
import type { SendAppreciationRequest } from '@/api-client/types.gen';
import { CURRENT_USER_KEY } from '@/hooks/useCurrentUser';

export const NOTIFICATIONS_KEY = ['notifications'];

export function useSendAppreciation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, body }: { taskId: number; body: SendAppreciationRequest }) => {
      const { data } = await postTasksAppreciation({ path: { taskId }, body });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'today_done'] });
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async () => {
      const { data } = await getNotifications();
      return data ?? [];
    },
  });
}
