'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { BottomNav } from '@/components/BottomNav';
import { useTasks, useCompleteTask } from '@/hooks/useTasks';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { TaskResponse } from '@/api-client/types.gen';

type Filter = 'pending' | 'today_done';

function TaskCard({ task, onComplete }: { task: TaskResponse; onComplete: (id: number) => void }) {
  const isPending = task.status === 'pending';
  return (
    <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm border border-gray-100">
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
              <TaskCard key={task.id} task={task} onComplete={handleComplete} />
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </AuthGuard>
  );
}
