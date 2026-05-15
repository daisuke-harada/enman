'use client';

import { useQuery } from '@tanstack/react-query';
import { getHealth } from '@/api-client';
import type { GetHealth200Response } from '@/api-client/types.gen';

export function useHealth() {
  return useQuery<GetHealth200Response>({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await getHealth();
      return data ?? {};
    },
    refetchInterval: 30_000,
  });
}
