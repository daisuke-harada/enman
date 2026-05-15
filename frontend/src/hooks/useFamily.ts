'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postFamilies, postFamiliesJoin } from '@/api-client';
import { CURRENT_USER_KEY } from '@/hooks/useCurrentUser';

export function useCreateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await postFamilies({ body: { name } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
    },
  });
}

export function useJoinFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data } = await postFamiliesJoin({ body: { invite_code: inviteCode } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
    },
  });
}
