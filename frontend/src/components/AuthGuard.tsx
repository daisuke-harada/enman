'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      router.replace('/login');
    }
  }, [router]);

  if (typeof window !== 'undefined' && !auth.isLoggedIn()) {
    return null;
  }

  return <>{children}</>;
}
