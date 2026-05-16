'use client';

import { AuthGuard } from '@/components/AuthGuard';
import { BottomNav } from '@/components/BottomNav';
import { Sidebar } from '@/components/Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        {/* サイドバー（デスクトップのみ） */}
        <aside className="hidden md:flex md:flex-col fixed inset-y-0 left-0 w-60 border-r border-white/60 z-30">
          <Sidebar />
        </aside>

        {/* メインコンテンツ */}
        <div className="flex-1 md:ml-60 pb-20 md:pb-0 min-h-screen">
          {children}
        </div>

        {/* BottomNav（モバイルのみ） */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </AuthGuard>
  );
}
