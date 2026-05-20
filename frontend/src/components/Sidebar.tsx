'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLogout } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { href: '/', icon: '🏠', label: 'タスク' },
  { href: '/dashboard', icon: '📊', label: 'ダッシュボード' },
  { href: '/notifications', icon: '🔔', label: '通知' },
  { href: '/profile', icon: '👤', label: 'マイページ' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.replace('/login');
  };

  return (
    <div className="flex flex-col h-full select-none bg-white/70 backdrop-blur-xl">
      {/* ロゴ */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#76C893] to-[#52B788] flex items-center justify-center shadow-lg shadow-green-200/50">
            <span className="text-lg">🍏</span>
          </div>
          <div>
            <p className="text-base font-bold text-gray-800 tracking-tight leading-tight">enman</p>
            <p className="text-[10px] text-gray-400 leading-tight">家族の感謝を可視化</p>
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#76C893]/20 to-[#52B788]/10 text-[#52B788] shadow-sm'
                  : 'text-gray-500 hover:bg-[#FFFAF0] hover:text-gray-800'
              }`}
            >
              <span className="w-5 text-center text-base">{icon}</span>
              <span>{label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#76C893]" />}
            </Link>
          );
        })}
      </nav>

      {/* ユーザー情報 */}
      <div className="px-3 pb-5 pt-3 border-t border-gray-100/80 space-y-2">
        {user && (
          <div className="px-4 py-3 rounded-2xl bg-[#FFFAF0] border border-[#76C893]/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#76C893]/30 to-[#52B788]/20 flex items-center justify-center text-sm">
                👤
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                <p className="text-xs text-gray-400">{user.role}</p>
              </div>
            </div>
            {user.enman_point != null && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-xs text-[#FF9E00] font-bold">⭐ {user.enman_point} pt</span>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={logout.isPending}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-50/80 rounded-2xl transition-colors disabled:opacity-50"
        >
          <span>↩</span>
          {logout.isPending ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </div>
    </div>
  );
}
