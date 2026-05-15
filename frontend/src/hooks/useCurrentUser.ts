'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsersMe, patchUsersMe } from '@/api-client';
import type { UpdateProfileRequest } from '@/api-client/types.gen';

export const CURRENT_USER_KEY = ['users', 'me'];

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: async () => {
      const { data } = await getUsersMe();
      return data;
    },
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateProfileRequest) => {
      const { data } = await patchUsersMe({ body });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
    },
  });
}
