'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, BarChart2, User } from 'lucide-react';

const tabs = [
  { href: '/',          label: 'タスク',     Icon: CheckSquare },
  { href: '/dashboard', label: '統計',       Icon: BarChart2   },
  { href: '/profile',   label: 'マイページ', Icon: User        },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="bg-white/80 backdrop-blur-xl border-t border-white/60 shadow-[0_-4px_24px_rgba(46,197,138,0.12)]">
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-[var(--r-pill)] transition-all ${
                  isActive ? 'text-[#2EC58A]' : 'text-[#8893A2] hover:text-[#586577]'
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="transition-transform"
                  style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}
                />
                <span className={`text-[10px] font-semibold ${isActive ? 'text-[#2EC58A]' : ''}`}>
                  {label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#2EC58A]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
