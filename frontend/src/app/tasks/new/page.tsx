'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
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
    <AppShell>
      <header
        className="px-5 pb-4 bg-transparent"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <div className="md:hidden">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#76C893] to-[#52B788] flex items-center justify-center shadow-md">
              <span className="text-base">➕</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">タスクを追加</h1>
          </div>
        </div>
        <h1 className="hidden md:block text-2xl font-bold text-gray-800 mb-1">タスクを追加</h1>
      </header>

      <div className="px-4 md:px-6 md:max-w-2xl space-y-5">
        {/* クイック登録 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white/80 backdrop-blur-md rounded-[28px] p-5 shadow-card border border-white/60"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">クイック登録</p>
          <form onSubmit={(e) => handleSubmit(e)} className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              placeholder="例：皿洗い"
              className="flex-1 bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40 focus:border-[#76C893] transition-all"
            />
            <motion.button
              type="submit"
              disabled={createTask.isPending}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-br from-[#76C893] to-[#52B788] text-white font-bold px-5 py-3 rounded-2xl text-sm shadow-lg shadow-green-200/50 transition-opacity disabled:opacity-60 shrink-0"
            >
              追加
            </motion.button>
          </form>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-500 bg-red-50 rounded-2xl px-4 py-2.5 mt-3"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* テンプレート */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">テンプレートから選ぶ</p>
          <div className="space-y-3">
            {Object.entries(grouped).map(([category, items], i) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: 'easeOut' }}
                className="bg-white/80 backdrop-blur-md rounded-[28px] p-5 shadow-card border border-white/60"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block text-[10px] font-semibold text-[#76C893] bg-[#76C893]/10 px-2.5 py-1 rounded-full">
                    {category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((tmpl) => (
                    <motion.button
                      key={tmpl.id}
                      onClick={() => handleTemplate(tmpl)}
                      disabled={createTask.isPending}
                      whileTap={{ scale: 0.94 }}
                      className="bg-[#FFFAF0] hover:bg-[#76C893]/10 border border-gray-200/80 hover:border-[#76C893]/40 text-gray-700 hover:text-[#52B788] text-sm px-4 py-2 rounded-full transition-all disabled:opacity-50 font-medium"
                    >
                      {tmpl.name}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
