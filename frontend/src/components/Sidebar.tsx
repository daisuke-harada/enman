'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CheckSquare, BarChart2, Bell, User, LogOut } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLogout } from '@/hooks/useAuth';
import { EnmanMark } from './EnmanMark';

const NAV_ITEMS = [
  { href: '/',              Icon: CheckSquare, label: 'タスク'       },
  { href: '/dashboard',     Icon: BarChart2,   label: 'ダッシュボード' },
  { href: '/notifications', Icon: Bell,        label: '通知'         },
  { href: '/profile',       Icon: User,        label: 'マイページ'   },
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
          <div className="w-9 h-9 rounded-[var(--r-lg)] bg-gradient-to-br from-[#2EC58A] to-[#15A06E] flex items-center justify-center shadow-lg shadow-green-200/50">
            <EnmanMark size={26} />
          </div>
          <div>
            <p className="text-base font-bold text-[#3A4658] tracking-tight leading-tight">enman</p>
            <p className="text-[10px] text-[#AEB8C4] leading-tight">家族の感謝を可視化</p>
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-[var(--r-lg)] text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[rgba(46,197,138,0.12)] text-[#15A06E] shadow-sm'
                  : 'text-[#8893A2] hover:bg-[var(--surface-tint-2)] hover:text-[#3A4658]'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2EC58A]" />}
            </Link>
          );
        })}
      </nav>

      {/* ユーザー情報 */}
      <div className="px-3 pb-5 pt-3 border-t border-[var(--border-soft)] space-y-2">
        {user && (
          <div className="px-4 py-3 rounded-[var(--r-lg)] bg-[var(--surface-tint)] border border-[var(--border-primary)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[rgba(46,197,138,0.15)] flex items-center justify-center">
                <User size={16} strokeWidth={2} className="text-[#2EC58A]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#3A4658] truncate">{user.name}</p>
                <p className="text-xs text-[#8893A2]">{user.role}</p>
              </div>
            </div>
            {user.enman_point != null && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="pill">{user.enman_point} pt</span>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={logout.isPending}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#8893A2] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] rounded-[var(--r-lg)] transition-colors disabled:opacity-50"
        >
          <LogOut size={16} strokeWidth={2} />
          {logout.isPending ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </div>
    </div>
  );
}
