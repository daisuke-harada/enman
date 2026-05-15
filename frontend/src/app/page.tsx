'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { BottomNav } from '@/components/BottomNav';
import { useTasks, useCompleteTask } from '@/hooks/useTasks';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSendAppreciation } from '@/hooks/useAppreciations';
import type { TaskResponse } from '@/api-client/types.gen';

type Filter = 'pending' | 'today_done';

const STAMPS: { type: 'great' | 'thanks' | 'cute' | 'love' | 'star'; emoji: string; label: string }[] = [
  { type: 'great', emoji: '👏', label: 'すごい！' },
  { type: 'thanks', emoji: '🙏', label: 'ありがとう' },
  { type: 'cute', emoji: '💕', label: 'かわいい' },
  { type: 'love', emoji: '❤️', label: '大好き' },
  { type: 'star', emoji: '⭐', label: '最高' },
];

function StampPicker({ taskId, currentUserId, doneBy, onSent }: {
  taskId: number;
  currentUserId: number;
  doneBy?: number | null;
  onSent: () => void;
}) {
  const sendAppreciation = useSendAppreciation();
  const [sent, setSent] = useState<string | null>(null);

  if (!doneBy || doneBy === currentUserId) return null;

  const handleStamp = async (type: 'great' | 'thanks' | 'cute' | 'love' | 'star') => {
    if (sent) return;
    await sendAppreciation.mutateAsync({ taskId, body: { stamp_type: type } });
    setSent(type);
    onSent();
  };

  if (sent) {
    const stamp = STAMPS.find((s) => s.type === sent);
    return <p className="text-xs text-green-600 mt-2 pl-11">{stamp?.emoji} 送りました！</p>;
  }

  return (
    <div className="flex gap-1 mt-2 pl-11 flex-wrap">
      {STAMPS.map((s) => (
        <button
          key={s.type}
          onClick={() => handleStamp(s.type)}
          disabled={sendAppreciation.isPending}
          title={s.label}
          className="text-lg hover:scale-125 transition-transform disabled:opacity-50"
        >
          {s.emoji}
        </button>
      ))}
    </div>
  );
}

function TaskCard({ task, currentUserId, onComplete }: {
  task: TaskResponse;
  currentUserId: number;
  onComplete: (id: number) => void;
}) {
  const [stampSent, setStampSent] = useState(false);
  const isPending = task.status === 'pending';

  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <button
          onClick={() => isPending && task.id && onComplete(task.id)}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isPending
              ? 'border-gray-300 hover:border-green-400 hover:bg-green-50'
              : 'border-green-500 bg-green-500'
          }`}
        >
          {!isPending && <span className="text-white text-xs font-bold">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${!isPending ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {task.title}
          </p>
          {task.category && (
            <p className="text-xs text-gray-400 mt-0.5">{task.category}</p>
          )}
        </div>
      </div>
      {!isPending && !stampSent && task.id && (
        <StampPicker
          taskId={task.id}
          currentUserId={currentUserId}
          doneBy={task.done_by}
          onSent={() => setStampSent(true)}
        />
      )}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('pending');
  const { data: user } = useCurrentUser();
  const { data: tasks = [], isLoading } = useTasks(filter);
  const completeTask = useCompleteTask();

  const handleComplete = async (taskId: number) => {
    await completeTask.mutateAsync(taskId);
  };

  const needsFamilySetup = user && !user.family_id;

  if (needsFamilySetup) {
    router.replace('/family/setup');
    return null;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen pb-20">
        <header className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
          <h1 className="text-xl font-bold text-gray-800">🍏 enman</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {user ? `${user.name}（${user.role}）` : ''}
          </p>
        </header>

        <div className="px-4 pt-4">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            {([['pending', 'これからやること'], ['today_done', '今日終わったこと']] as const).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filter === f ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="text-center py-12 text-gray-400 text-sm">読み込み中...</div>
          )}

          {!isLoading && tasks.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">{filter === 'pending' ? '🎉' : '📋'}</p>
              <p className="text-sm text-gray-500">
                {filter === 'pending'
                  ? 'やることは全部終わりました！'
                  : '今日はまだ完了したタスクがありません'}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserId={user?.id ?? 0}
                onComplete={handleComplete}
              />
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </AuthGuard>
  );
}
