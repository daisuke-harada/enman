'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import { useTasks, useCompleteTask } from '@/hooks/useTasks';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSendAppreciation } from '@/hooks/useAppreciations';
import type { TaskResponse } from '@/api-client/types.gen';

type Filter = 'pending' | 'today_done';

// canvas-confettiを動的インポート（SSR対策）
async function launchConfetti() {
  const confetti = (await import('canvas-confetti')).default;
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#76C893', '#FF9E00', '#FFB74D', '#A8DDB5', '#FFC1CC', '#FFD700'],
    shapes: ['circle', 'square'],
    scalar: 0.9,
  });
}

function CommentForm({ taskId, currentUserId, doneBy, comments }: {
  taskId: number;
  currentUserId: number;
  doneBy?: number | null;
  comments?: { from_user_id?: number; from_user_name?: string; message?: string | null }[];
}) {
  const sendAppreciation = useSendAppreciation();
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  if (!doneBy || doneBy === currentUserId) return null;

  const alreadySent = comments?.some((c) => c.from_user_id === currentUserId) ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sendAppreciation.isPending) return;
    await sendAppreciation.mutateAsync({ taskId, body: { message: text.trim() } });
    setText('');
    setSent(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3 pl-12 space-y-1.5"
    >
      {comments && comments.length > 0 && (
        <div className="space-y-1">
          {comments.map((c, i) => (
            <p key={i} className="text-xs text-gray-500">
              <span className="font-semibold text-[#52B788]">{c.from_user_name}</span>
              {': '}
              {c.message}
            </p>
          ))}
        </div>
      )}
      {!alreadySent && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="コメントを送る..."
            maxLength={255}
            className="flex-1 bg-[#F7FDF9] border border-[#76C893]/30 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#76C893]/50"
          />
          <motion.button
            type="submit"
            disabled={!text.trim() || sendAppreciation.isPending}
            whileTap={{ scale: 0.95 }}
            className="text-xs font-semibold text-[#52B788] disabled:opacity-40 px-2"
          >
            {sent ? '✓' : '送信'}
          </motion.button>
        </form>
      )}
    </motion.div>
  );
}

function TaskCard({ task, currentUserId, onComplete }: {
  task: TaskResponse;
  currentUserId: number;
  onComplete: (id: number) => void;
}) {
  const isPending = task.status === 'pending';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-white/80 backdrop-blur-md rounded-[28px] px-5 py-4 shadow-card border border-white/60"
    >
      <div className="flex items-center gap-4">
        {/* 完了ボタン */}
        <motion.button
          onClick={() => { if (isPending && task.id) onComplete(task.id); }}
          whileTap={isPending ? { scale: 0.88 } : {}}
          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            isPending
              ? 'border-[#76C893]/50 hover:border-[#76C893] hover:bg-[#76C893]/10'
              : 'border-[#76C893] bg-gradient-to-br from-[#76C893] to-[#52B788] shadow-lg shadow-green-200/50'
          }`}
        >
          {!isPending && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-white text-sm font-bold"
            >
              ✓
            </motion.span>
          )}
        </motion.button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate transition-all ${
            !isPending ? 'line-through text-gray-400' : 'text-gray-700'
          }`}>
            {task.title}
          </p>
          {task.category && (
            <span className="inline-block mt-1 text-[10px] font-medium text-[#76C893] bg-[#76C893]/10 px-2 py-0.5 rounded-full">
              {task.category}
            </span>
          )}
        </div>
      </div>

      {!isPending && task.id && (
        <CommentForm
          taskId={task.id}
          currentUserId={currentUserId}
          doneBy={task.done_by}
          comments={task.comments}
        />
      )}
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('pending');
  const { data: user } = useCurrentUser();
  const { data: tasks = [], isLoading } = useTasks(filter);
  const completeTask = useCompleteTask();

  useEffect(() => {
    if (user && !user.family_id) {
      router.replace('/family/setup');
    }
  }, [user, router]);

  const handleComplete = useCallback(async (taskId: number) => {
    try {
      // @capacitor/haptics: HapticsPlugin.impact({ style: ImpactStyle.Medium })
      await completeTask.mutateAsync(taskId);
      await launchConfetti();
    } catch {
      // エラーは mutation の状態で管理
    }
  }, [completeTask]);

  return (
    <AppShell>
      {/* ヘッダー */}
      <header
        className="px-5 pb-4 bg-transparent"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <div className="md:hidden">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#76C893] to-[#52B788] flex items-center justify-center shadow-md">
              <span className="text-base">🍏</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">enman</h1>
          </div>
          {user && (
            <p className="text-xs text-gray-400 pl-0.5">
              {user.name}（{user.role}）
            </p>
          )}
        </div>
        <h1 className="hidden md:block text-2xl font-bold text-gray-800 mb-1">タスク</h1>
      </header>

      <div className="px-4 md:px-6 md:max-w-2xl">
        {/* フィルタータブ */}
        <div className="flex bg-white/60 backdrop-blur-sm rounded-[20px] p-1 mb-5 shadow-sm border border-white/60">
          {([['pending', 'これからやること'], ['today_done', '今日終わったこと']] as const).map(([f, label]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2.5 rounded-[16px] text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-[#76C893] to-[#52B788] text-white shadow-md shadow-green-200/40'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ローディング */}
        {isLoading && (
          <div className="text-center py-16 text-gray-400 text-sm">読み込み中...</div>
        )}

        {/* 空状態 */}
        {!isLoading && tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <p className="text-5xl mb-4">{filter === 'pending' ? '🎉' : '📋'}</p>
            <p className="text-sm font-medium text-gray-500">
              {filter === 'pending'
                ? 'やることは全部終わりました！'
                : '今日はまだ完了したタスクがありません'}
            </p>
          </motion.div>
        )}

        {/* タスクリスト */}
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserId={user?.id ?? 0}
                onComplete={handleComplete}
              />
            ))}
          </div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
