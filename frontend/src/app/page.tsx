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

const STAMPS: { type: 'great' | 'thanks' | 'cute' | 'love' | 'star'; emoji: string; label: string }[] = [
  { type: 'great', emoji: '👏', label: 'すごい！' },
  { type: 'thanks', emoji: '🙏', label: 'ありがとう' },
  { type: 'cute', emoji: '💕', label: 'かわいい' },
  { type: 'love', emoji: '❤️', label: '大好き' },
  { type: 'star', emoji: '⭐', label: '最高' },
];

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

function StampButton({ stamp, onPress, disabled }: {
  stamp: typeof STAMPS[number];
  onPress: () => void;
  disabled: boolean;
}) {
  const [bouncing, setBouncing] = useState(false);

  const handleClick = () => {
    if (disabled || bouncing) return;
    setBouncing(true);
    onPress();
    setTimeout(() => setBouncing(false), 400);
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      title={stamp.label}
      animate={bouncing ? { scale: [1, 1.3, 0.9, 1] } : { scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className="text-2xl disabled:opacity-40 focus:outline-none"
    >
      {stamp.emoji}
    </motion.button>
  );
}

function StampPicker({ taskId, currentUserId, doneBy, onSent }: {
  taskId: number;
  currentUserId: number;
  doneBy?: number | null;
  onSent: () => void;
}) {
  const sendAppreciation = useSendAppreciation();
  const [sent, setSent] = useState<string | null>(null);

  // フィードバックを表示してから親に通知（React 18バッチングで即アンマウントを防ぐ）
  useEffect(() => {
    if (sent) {
      const timer = setTimeout(() => onSent(), 1500);
      return () => clearTimeout(timer);
    }
  }, [sent, onSent]);

  if (!doneBy || doneBy === currentUserId) return null;

  const handleStamp = async (type: typeof STAMPS[number]['type']) => {
    if (sent) return;
    // @capacitor/haptics: HapticsPlugin.impact({ style: ImpactStyle.Light })
    await sendAppreciation.mutateAsync({ taskId, body: { stamp_type: type } });
    setSent(type);
  };

  if (sent) {
    const stamp = STAMPS.find((s) => s.type === sent);
    return (
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-[#52B788] mt-2 pl-12 font-medium"
      >
        {stamp?.emoji} 送りました！
      </motion.p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="flex gap-3 mt-3 pl-12"
    >
      {STAMPS.map((s) => (
        <StampButton
          key={s.type}
          stamp={s}
          onPress={() => handleStamp(s.type)}
          disabled={sendAppreciation.isPending}
        />
      ))}
    </motion.div>
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

      {!isPending && !stampSent && task.id && (
        <StampPicker
          taskId={task.id}
          currentUserId={currentUserId}
          doneBy={task.done_by}
          onSent={() => setStampSent(true)}
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
