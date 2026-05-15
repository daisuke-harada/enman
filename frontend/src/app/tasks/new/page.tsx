'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { BottomNav } from '@/components/BottomNav';
import { useCreateTask, useTaskTemplates } from '@/hooks/useTasks';
import type { TaskTemplateResponse } from '@/api-client/types.gen';

function groupByCategory(templates: TaskTemplateResponse[]) {
  return templates.reduce<Record<string, TaskTemplateResponse[]>>((acc, t) => {
    const cat = t.category ?? 'その他';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});
}

export default function NewTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const createTask = useCreateTask();
  const { data: templates = [] } = useTaskTemplates();
  const grouped = groupByCategory(templates);

  const handleSubmit = async (e: React.FormEvent, category?: string) => {
    e.preventDefault();
    if (!title.trim()) { setError('タスク名を入力してください'); return; }
    setError('');
    try {
      await createTask.mutateAsync({ title, category });
      router.push('/');
    } catch {
      setError('タスクの作成に失敗しました');
    }
  };

  const handleTemplate = async (tmpl: TaskTemplateResponse) => {
    try {
      await createTask.mutateAsync({ title: tmpl.name!, category: tmpl.category! });
      router.push('/');
    } catch {
      setError('タスクの作成に失敗しました');
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen pb-20">
        <header className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
          <h2 className="text-lg font-bold text-gray-800">タスクを追加</h2>
        </header>

        <div className="px-4 pt-4 space-y-6">
          {/* クイック登録 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">クイック登録</h3>
            <form onSubmit={(e) => handleSubmit(e)} className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setError(''); }}
                placeholder="例：皿洗い"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button
                type="submit"
                disabled={createTask.isPending}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 shrink-0"
              >
                追加
              </button>
            </form>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>

          {/* テンプレート */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">テンプレートから選ぶ</h3>
            <div className="space-y-3">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="text-xs font-medium text-gray-400 mb-2">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        onClick={() => handleTemplate(tmpl)}
                        disabled={createTask.isPending}
                        className="bg-gray-50 hover:bg-green-50 hover:text-green-700 border border-gray-200 hover:border-green-300 text-gray-700 text-sm px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                      >
                        {tmpl.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </AuthGuard>
  );
}
