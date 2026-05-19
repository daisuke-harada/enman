'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import { useContributions, useFamilyGoals, useCreateFamilyGoal, useFamilyTimeline } from '@/hooks/useDashboard';
import type { ContributionItem, AppreciationResponse, FamilyGoalResponse } from '@/api-client/types.gen';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const USER_COLORS = ['#76C893', '#FF9E00', '#52B788', '#FFB74D', '#A8DDB5', '#FFC1CC', '#06b6d4', '#84cc16'];


function aggregateByUser(items: ContributionItem[]) {
  const map = new Map<number, { name: string; count: number }>();
  for (const item of items) {
    if (!item.user_id || !item.user_name || !item.count) continue;
    const existing = map.get(item.user_id);
    if (existing) {
      existing.count += item.count;
    } else {
      map.set(item.user_id, { name: item.user_name, count: item.count });
    }
  }
  return Array.from(map.values());
}

function ContributionChart({ items }: { items: ContributionItem[] }) {
  const data = aggregateByUser(items);
  if (data.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-sm text-gray-400">まだデータがありません</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={85}
          dataKey="count"
          nameKey="name"
          strokeWidth={0}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={USER_COLORS[index % USER_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value} 件`, '完了数']}
          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function GoalProgressBar({ goal }: { goal: FamilyGoalResponse }) {
  const current = goal.current_points ?? 0;
  const target = goal.target_points ?? 1;
  const pct = Math.min(100, Math.round((current / target) * 100));
  const achieved = current >= target;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-700">{goal.title}</span>
        <span className={`text-xs font-bold ${achieved ? 'text-[#76C893]' : 'text-[#FF9E00]'}`}>
          {achieved ? '🎉 達成！' : `${current} / ${target} pt`}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${achieved
            ? 'bg-gradient-to-r from-[#76C893] to-[#52B788]'
            : 'bg-gradient-to-r from-[#FF9E00] to-[#FFB74D]'}`}
        />
      </div>
      <p className="text-[10px] text-gray-400 text-right">{pct}%</p>
    </div>
  );
}

function TimelineCard({ item, index }: { item: AppreciationResponse; index: number }) {
  const createdAt = item.created_at ? new Date(item.created_at) : null;
  const dateStr = createdAt
    ? `${createdAt.getMonth() + 1}/${createdAt.getDate()} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}`
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
      className="flex items-start gap-3 py-3 border-b border-gray-100/80 last:border-0"
    >
      <span className="text-xl shrink-0">💬</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-700">
          <span className="font-semibold text-[#52B788]">{item.from_user_name}</span>
          <span className="text-gray-400"> → </span>
          <span className="font-semibold text-[#FF9E00]">{item.to_user_name}</span>
          {item.task_title && <span className="text-gray-400 ml-1">「{item.task_title}」</span>}
        </p>
        {item.message && <p className="text-xs text-gray-500 mt-0.5">{item.message}</p>}
        <p className="text-[10px] text-gray-300 mt-0.5">{dateStr}</p>
      </div>
    </motion.div>
  );
}

function AddGoalForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState('');
  const [error, setError] = useState('');
  const createGoal = useCreateFamilyGoal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(points, 10);
    if (!title.trim() || isNaN(p) || p <= 0) {
      setError('タイトルと目標ポイント（1以上）を入力してください');
      return;
    }
    await createGoal.mutateAsync({ title, target_points: p });
    onClose();
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="space-y-3 mt-4 overflow-hidden"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="例：週末の焼肉"
        className="w-full bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40 focus:border-[#76C893] transition-all"
      />
      <input
        type="number"
        value={points}
        onChange={(e) => setPoints(e.target.value)}
        placeholder="目標ポイント（例：100）"
        min={1}
        className="w-full bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40 focus:border-[#76C893] transition-all"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <motion.button
          type="submit"
          disabled={createGoal.isPending}
          whileTap={{ scale: 0.96 }}
          className="flex-1 bg-gradient-to-br from-[#76C893] to-[#52B788] text-white font-bold py-3 rounded-2xl text-sm shadow-lg shadow-green-200/50 disabled:opacity-60"
        >
          {createGoal.isPending ? '追加中...' : '追加する'}
        </motion.button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-[#FFFAF0] border border-gray-200/80 text-gray-500 py-3 rounded-2xl text-sm font-medium"
        >
          キャンセル
        </button>
      </div>
    </motion.form>
  );
}

export default function DashboardPage() {
  const { data: contributions = [], isLoading: loadingContrib } = useContributions();
  const { data: goals = [], isLoading: loadingGoals } = useFamilyGoals();
  const { data: timeline = [], isLoading: loadingTimeline } = useFamilyTimeline();
  const [showAddGoal, setShowAddGoal] = useState(false);

  return (
    <AppShell>
      <header
        className="px-5 pb-4 bg-transparent"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <div className="md:hidden">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#76C893] to-[#52B788] flex items-center justify-center shadow-md">
              <span className="text-base">📊</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">ダッシュボード</h1>
          </div>
          <p className="text-xs text-gray-400 pl-0.5">家族の貢献を可視化</p>
        </div>
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-gray-800 mb-0.5">ダッシュボード</h1>
          <p className="text-xs text-gray-400">家族の貢献を可視化</p>
        </div>
      </header>

      <div className="px-4 pb-4 md:px-6 md:grid md:grid-cols-2 md:gap-4 md:items-start space-y-4 md:space-y-0">

        {/* 貢献度グラフ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white/80 backdrop-blur-md rounded-[28px] p-5 shadow-card border border-white/60"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">貢献度グラフ</p>
          {loadingContrib ? (
            <div className="text-center py-10 text-gray-400 text-sm">読み込み中...</div>
          ) : (
            <ContributionChart items={contributions} />
          )}
        </motion.div>

        {/* ご褒美プログレスバー */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06, ease: 'easeOut' }}
          className="bg-white/80 backdrop-blur-md rounded-[28px] p-5 shadow-card border border-white/60"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ご褒美目標</p>
            <button
              onClick={() => setShowAddGoal(!showAddGoal)}
              className="text-xs text-[#76C893] font-semibold hover:text-[#52B788] transition-colors"
            >
              {showAddGoal ? '閉じる' : '＋ 追加'}
            </button>
          </div>

          <AnimatePresence>
            {showAddGoal && <AddGoalForm onClose={() => setShowAddGoal(false)} />}
          </AnimatePresence>

          {loadingGoals ? (
            <div className="text-center py-4 text-gray-400 text-sm">読み込み中...</div>
          ) : goals.length === 0 && !showAddGoal ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-sm text-gray-400">目標を設定しましょう！</p>
            </div>
          ) : (
            <div className="space-y-5 mt-4">
              {goals.map((goal) => (
                <GoalProgressBar key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </motion.div>

        {/* 感謝タイムライン */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
          className="bg-white/80 backdrop-blur-md rounded-[28px] p-5 shadow-card border border-white/60 md:col-span-2"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">感謝タイムライン</p>
          {loadingTimeline ? (
            <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm text-gray-400">まだ感謝のやりとりがありません</p>
            </div>
          ) : (
            <div className="md:columns-2 md:gap-6">
              {timeline.slice(0, 20).map((item, i) => (
                <div key={item.id} className="break-inside-avoid">
                  <TimelineCard item={item} index={i} />
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </AppShell>
  );
}
