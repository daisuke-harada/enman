'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import { useCreateTask, useTaskTemplates } from '@/hooks/useTasks';
import { useCreateRecurrenceRule } from '@/hooks/useCalendar';
import type { TaskTemplateResponse } from '@/api-client/types.gen';

type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

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
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('daily');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');

  const createTask = useCreateTask();
  const createRule = useCreateRecurrenceRule();
  const { data: templates = [] } = useTaskTemplates();
  const grouped = groupByCategory(templates);

  const isPending = createTask.isPending || createRule.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('タスク名を入力してください'); return; }
    setError('');

    try {
      if (isRecurring) {
        await createRule.mutateAsync({
          title: title.trim(),
          frequency,
          start_date: startDate,
          day_of_week: frequency === 'weekly' ? dayOfWeek : undefined,
          day_of_month: frequency === 'monthly' ? dayOfMonth : undefined,
        });
        router.push('/calendar');
      } else {
        await createTask.mutateAsync({ title: title.trim(), scheduled_date: today });
        router.push('/');
      }
    } catch {
      setError(isRecurring ? '繰り返しルールの作成に失敗しました' : 'タスクの作成に失敗しました');
    }
  };

  const handleTemplate = async (tmpl: TaskTemplateResponse) => {
    try {
      await createTask.mutateAsync({ title: tmpl.name!, category: tmpl.category!, scheduled_date: today });
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
        {/* メインフォーム */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white/80 backdrop-blur-md rounded-[28px] p-5 shadow-card border border-white/60"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* タイトル入力 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">タスク名</label>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setError(''); }}
                placeholder="例：皿洗い"
                autoFocus
                className="w-full bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40 focus:border-[#76C893] transition-all"
              />
            </div>

            {/* 繰り返しトグル */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="text-base">🔁</span>
                <span className="text-sm font-medium text-gray-700">繰り返す</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRecurring((v) => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  isRecurring ? 'bg-[#76C893]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    isRecurring ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* 繰り返し設定（展開） */}
            <AnimatePresence>
              {isRecurring && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden space-y-4"
                >
                  {/* 頻度選択 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">繰り返し</label>
                    <div className="flex gap-2">
                      {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFrequency(f)}
                          className={`flex-1 py-2 rounded-2xl text-xs font-semibold transition-all ${
                            frequency === f
                              ? 'bg-gradient-to-r from-[#76C893] to-[#52B788] text-white shadow-md'
                              : 'bg-[#FFFAF0] text-gray-500 border border-gray-200/80'
                          }`}
                        >
                          {f === 'daily' ? '毎日' : f === 'weekly' ? '毎週' : '毎月'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 曜日選択 */}
                  {frequency === 'weekly' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">曜日</label>
                      <div className="flex gap-1">
                        {WEEKDAY_LABELS.map((label, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setDayOfWeek(idx)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                              dayOfWeek === idx
                                ? 'bg-[#76C893] text-white'
                                : 'bg-[#FFFAF0] text-gray-500 border border-gray-200/60'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 日付選択 */}
                  {frequency === 'monthly' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-500">毎月</label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(Number(e.target.value))}
                        className="w-20 bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40 text-center"
                      />
                      <span className="text-xs text-gray-400">日</span>
                    </div>
                  )}

                  {/* 開始日 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">開始日</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* エラー */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-500 bg-red-50 rounded-2xl px-4 py-2.5"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* 送信ボタン */}
            <motion.button
              type="submit"
              disabled={isPending}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-gradient-to-br from-[#76C893] to-[#52B788] text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-green-200/50 disabled:opacity-60"
            >
              {isPending ? '作成中...' : isRecurring ? '繰り返しタスクを作成' : 'タスクを追加'}
            </motion.button>
          </form>
        </motion.div>

        {/* テンプレートから選ぶ */}
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
