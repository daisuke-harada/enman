'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postAuthRegister, postAuthLogin, deleteAuthLogout } from '@/api-client';
import { auth } from '@/lib/auth';
import type { RegisterRequest, LoginRequest } from '@/api-client/types.gen';

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: RegisterRequest) => {
      const { data } = await postAuthRegister({ body });
      if (data?.access_token && data?.refresh_token) {
        auth.setTokens(data.access_token, data.refresh_token);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: LoginRequest) => {
      const { data, error } = await postAuthLogin({ body });
      if (error) throw error;
      if (data?.access_token && data?.refresh_token) {
        auth.setTokens(data.access_token, data.refresh_token);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const refreshToken = auth.getRefreshToken();
      if (refreshToken) {
        await deleteAuthLogout({ body: { refresh_token: refreshToken } });
      }
      auth.clear();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
