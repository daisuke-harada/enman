'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'タスク', icon: '🏠' },
  { href: '/tasks/new', label: '追加', icon: '➕' },
  { href: '/dashboard', label: '統計', icon: '📊' },
  { href: '/notifications', label: '通知', icon: '🔔' },
  { href: '/profile', label: 'マイページ', icon: '👤' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="bg-white/80 backdrop-blur-xl border-t border-white/60 shadow-[0_-4px_24px_rgba(118,200,147,0.12)]">
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${
                  isActive ? 'text-[#52B788]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {icon}
                </span>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-[#52B788]' : ''}`}>
                  {label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#76C893]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
