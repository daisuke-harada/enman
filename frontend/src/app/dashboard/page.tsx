'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { BottomNav } from '@/components/BottomNav';
import { useContributions, useFamilyGoals, useCreateFamilyGoal, useFamilyTimeline } from '@/hooks/useDashboard';
import type { ContributionItem, AppreciationResponse, FamilyGoalResponse } from '@/api-client/types.gen';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// 各ユーザーの色（最大8人）
const USER_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const STAMP_EMOJI: Record<string, string> = {
  great: '👏', thanks: '🙏', cute: '💕', love: '❤️', star: '⭐',
};

// 貢献度グラフ用にユーザー別合計を集計
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
      <div className="text-center py-8 text-gray-400 text-sm">
        まだデータがありません
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
        >
          {data.map((_, index) => (
            <Cell key={index} fill={USER_COLORS[index % USER_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} 件`, '完了数']} />
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
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{goal.title}</span>
        <span className={`text-xs font-bold ${achieved ? 'text-green-600' : 'text-yellow-600'}`}>
          {achieved ? '🎉 達成！' : `${current} / ${target} pt`}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${achieved ? 'bg-green-500' : 'bg-yellow-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 text-right">{pct}%</p>
    </div>
  );
}

function TimelineCard({ item }: { item: AppreciationResponse }) {
  const stamp = item.stamp_type ?? 'thanks';
  const createdAt = item.created_at ? new Date(item.created_at) : null;
  const dateStr = createdAt
    ? `${createdAt.getMonth() + 1}/${createdAt.getDate()} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}`
    : '';

  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
      <span className="text-2xl shrink-0">{STAMP_EMOJI[stamp]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-700">
          <span className="font-semibold text-green-600">{item.from_user_name}</span>
          {' → '}
          <span className="font-semibold text-blue-600">{item.to_user_name}</span>
          {item.task_title && <span className="text-gray-400">「{item.task_title}」</span>}
        </p>
        {item.message && <p className="text-xs text-gray-500 mt-0.5">{item.message}</p>}
        <p className="text-xs text-gray-300">{dateStr}</p>
      </div>
    </div>
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
    <form onSubmit={handleSubmit} className="space-y-3 mt-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="例：週末の焼肉"
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
      />
      <input
        type="number"
        value={points}
        onChange={(e) => setPoints(e.target.value)}
        placeholder="目標ポイント（例：100）"
        min={1}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={createGoal.isPending}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {createGoal.isPending ? '追加中...' : '追加する'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-xl text-sm"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

export default function DashboardPage() {
  const { data: contributions = [], isLoading: loadingContrib } = useContributions();
  const { data: goals = [], isLoading: loadingGoals } = useFamilyGoals();
  const { data: timeline = [], isLoading: loadingTimeline } = useFamilyTimeline();
  const [showAddGoal, setShowAddGoal] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen pb-20">
        <header className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
          <h2 className="text-lg font-bold text-gray-800">ダッシュボード</h2>
          <p className="text-xs text-gray-400 mt-0.5">家族の貢献を可視化</p>
        </header>

        <div className="px-4 pt-4 space-y-4">
          {/* 貢献度グラフ */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">貢献度グラフ</h3>
            {loadingContrib ? (
              <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>
            ) : (
              <ContributionChart items={contributions} />
            )}
          </div>

          {/* ご褒美プログレスバー */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ご褒美目標</h3>
              <button
                onClick={() => setShowAddGoal(!showAddGoal)}
                className="text-xs text-green-600 font-medium"
              >
                {showAddGoal ? '閉じる' : '＋ 追加'}
              </button>
            </div>

            {showAddGoal && <AddGoalForm onClose={() => setShowAddGoal(false)} />}

            {loadingGoals ? (
              <div className="text-center py-4 text-gray-400 text-sm">読み込み中...</div>
            ) : goals.length === 0 && !showAddGoal ? (
              <p className="text-sm text-gray-400 text-center py-4">目標を設定しましょう！</p>
            ) : (
              <div className="space-y-4 mt-2">
                {goals.map((goal) => (
                  <GoalProgressBar key={goal.id} goal={goal} />
                ))}
              </div>
            )}
          </div>

          {/* 感謝タイムライン */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">感謝タイムライン</h3>
            {loadingTimeline ? (
              <div className="text-center py-4 text-gray-400 text-sm">読み込み中...</div>
            ) : timeline.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">まだ感謝のやりとりがありません</p>
            ) : (
              <div>
                {timeline.slice(0, 20).map((item) => (
                  <TimelineCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </AuthGuard>
  );
}
