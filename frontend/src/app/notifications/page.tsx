'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import { useNotifications } from '@/hooks/useAppreciations';
import type { AppreciationResponse } from '@/api-client/types.gen';

const STAMP_EMOJI: Record<string, string> = {
  great: '👏',
  thanks: '🙏',
  cute: '💕',
  love: '❤️',
  star: '⭐',
};

const STAMP_LABEL: Record<string, string> = {
  great: 'すごい！',
  thanks: 'ありがとう',
  cute: 'かわいい',
  love: '大好き',
  star: '最高',
};

const STAMP_COLOR: Record<string, string> = {
  great: 'from-blue-400/20 to-blue-300/10 border-blue-200/40',
  thanks: 'from-[#76C893]/20 to-[#52B788]/10 border-[#76C893]/30',
  cute: 'from-pink-400/20 to-pink-300/10 border-pink-200/40',
  love: 'from-red-400/20 to-red-300/10 border-red-200/40',
  star: 'from-[#FF9E00]/20 to-[#FFB74D]/10 border-[#FF9E00]/30',
};

function NotificationCard({ item, index }: { item: AppreciationResponse; index: number }) {
  const stamp = item.stamp_type ?? 'thanks';
  const createdAt = item.created_at ? new Date(item.created_at) : null;
  const dateStr = createdAt
    ? `${createdAt.getMonth() + 1}/${createdAt.getDate()} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}`
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
      className={`bg-gradient-to-r ${STAMP_COLOR[stamp]} backdrop-blur-md rounded-[24px] px-5 py-4 border shadow-sm`}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-2xl">{STAMP_EMOJI[stamp]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">
            <span className="text-[#52B788]">{item.from_user_name}</span>
            <span className="text-gray-500 font-normal"> さんから </span>
            <span className="text-[#FF9E00] font-bold">{STAMP_LABEL[stamp]}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1 truncate">「{item.task_title}」</p>
          {item.message && (
            <p className="text-xs text-gray-600 mt-2 bg-white/50 rounded-xl px-3 py-2 border border-white/60">
              {item.message}
            </p>
          )}
          <p className="text-[10px] text-gray-400 mt-2">{dateStr}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();

  return (
    <AppShell>
      <header
        className="px-5 pb-4 bg-transparent"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <div className="md:hidden">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#76C893] to-[#52B788] flex items-center justify-center shadow-md">
              <span className="text-base">🔔</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">通知</h1>
          </div>
          <p className="text-xs text-gray-400 pl-0.5">もらった感謝スタンプ</p>
        </div>
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-gray-800 mb-0.5">通知</h1>
          <p className="text-xs text-gray-400">もらった感謝スタンプ</p>
        </div>
      </header>

      <div className="px-4 md:px-6 md:max-w-2xl">
        {isLoading && (
          <div className="text-center py-16 text-gray-400 text-sm">読み込み中...</div>
        )}

        {!isLoading && notifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <p className="text-5xl mb-4">🔔</p>
            <p className="text-sm font-medium text-gray-500">まだ通知はありません</p>
            <p className="text-xs text-gray-400 mt-1">タスクを完了すると感謝が届きます</p>
          </motion.div>
        )}

        <AnimatePresence>
          <div className="space-y-3">
            {notifications.map((item, i) => (
              <NotificationCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
