'use client';

import { useMutation } from '@tanstack/react-query';
import { postAuthRegister, postAuthLogin, deleteAuthLogout } from '@/api-client';
import { auth } from '@/lib/auth';
import type { RegisterRequest, LoginRequest } from '@/api-client/types.gen';

export function useRegister() {
  return useMutation({
    mutationFn: async (body: RegisterRequest) => {
      const { data } = await postAuthRegister({ body });
      if (data?.access_token && data?.refresh_token) {
        auth.setTokens(data.access_token, data.refresh_token);
      }
      return data;
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (body: LoginRequest) => {
      const { data } = await postAuthLogin({ body });
      if (data?.access_token && data?.refresh_token) {
        auth.setTokens(data.access_token, data.refresh_token);
      }
      return data;
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const refreshToken = auth.getRefreshToken();
      if (refreshToken) {
        await deleteAuthLogout({ body: { refresh_token: refreshToken } });
      }
      auth.clear();
    },
  });
}
