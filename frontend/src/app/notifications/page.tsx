'use client';

import { AuthGuard } from '@/components/AuthGuard';
import { BottomNav } from '@/components/BottomNav';
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

function NotificationCard({ item }: { item: AppreciationResponse }) {
  const stamp = item.stamp_type ?? 'thanks';
  const createdAt = item.created_at ? new Date(item.created_at) : null;
  const dateStr = createdAt
    ? `${createdAt.getMonth() + 1}/${createdAt.getDate()} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}`
    : '';

  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
      <div className="flex items-start gap-3">
        <span className="text-3xl shrink-0">{STAMP_EMOJI[stamp]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">
            <span className="text-green-600">{item.from_user_name}</span>
            {' さんから '}
            <span className="text-yellow-500 font-bold">{STAMP_LABEL[stamp]}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">「{item.task_title}」</p>
          {item.message && (
            <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded-lg px-2 py-1">
              {item.message}
            </p>
          )}
          <p className="text-xs text-gray-300 mt-1">{dateStr}</p>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();

  return (
    <AuthGuard>
      <div className="min-h-screen pb-20">
        <header className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
          <h2 className="text-lg font-bold text-gray-800">通知</h2>
          <p className="text-xs text-gray-400 mt-0.5">もらった感謝スタンプ</p>
        </header>

        <div className="px-4 pt-4">
          {isLoading && (
            <div className="text-center py-12 text-gray-400 text-sm">読み込み中...</div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔔</p>
              <p className="text-sm text-gray-500">まだ通知はありません</p>
              <p className="text-xs text-gray-400 mt-1">タスクを完了すると感謝が届きます</p>
            </div>
          )}

          <div className="space-y-2">
            {notifications.map((item) => (
              <NotificationCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </AuthGuard>
  );
}
