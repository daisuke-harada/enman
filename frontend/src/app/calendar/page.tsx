'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import { useCalendar } from '@/hooks/useCalendar';
import type { CalendarDayItem, CalendarTaskItem } from '@/api-client/types.gen';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const MEMBER_COLORS = [
  'bg-[#2EC58A]',
  'bg-[#FF6F9C]',
  'bg-[#60A5FA]',
  'bg-[#E84E80]',
  'bg-[#A29BFE]',
  'bg-[#93E5BF]',
];

function useMemberColorMap(days: CalendarDayItem[]) {
  const colorMap = new Map<number, string>();
  let colorIdx = 0;
  for (const day of days) {
    for (const task of day.tasks ?? []) {
      const uid = task.user_id;
      if (uid != null && !colorMap.has(uid)) {
        colorMap.set(uid, MEMBER_COLORS[colorIdx % MEMBER_COLORS.length]);
        colorIdx++;
      }
    }
  }
  return colorMap;
}

function DayCell({
  date,
  tasks,
  isCurrentMonth,
  isToday,
  colorMap,
  onClick,
}: {
  date: Date;
  tasks: CalendarTaskItem[];
  isCurrentMonth: boolean;
  isToday: boolean;
  colorMap: Map<number, string>;
  onClick: () => void;
}) {
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const pendingTasks = tasks.filter((t) => t.status === 'pending');

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center pt-1.5 pb-1 rounded-2xl min-h-[52px] transition-all active:scale-95 ${
        isCurrentMonth ? 'hover:bg-[#EFFCF6]' : 'opacity-40'
      } ${isToday ? 'bg-[#E6FAEF]' : ''}`}
    >
      <span
        className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
          isToday
            ? 'bg-gradient-to-br from-[#2EC58A] to-[#15A06E] text-white shadow-md'
            : 'text-gray-700'
        }`}
      >
        {date.getDate()}
      </span>

      {/* タスクドット */}
      {tasks.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5 mt-1 max-w-[36px]">
          {doneTasks.slice(0, 3).map((t, i) => (
            <span
              key={`done-${i}`}
              className={`w-1.5 h-1.5 rounded-full ${
                t.user_id != null ? (colorMap.get(t.user_id) ?? 'bg-gray-300') : 'bg-gray-300'
              }`}
            />
          ))}
          {pendingTasks.slice(0, 3).map((t, i) => (
            <span
              key={`pending-${i}`}
              className={`w-1.5 h-1.5 rounded-full opacity-40 ${
                t.user_id != null ? (colorMap.get(t.user_id) ?? 'bg-gray-300') : 'bg-gray-300'
              }`}
            />
          ))}
          {tasks.length > 6 && (
            <span className="text-[8px] text-gray-400 font-medium">+{tasks.length - 6}</span>
          )}
        </div>
      )}
    </button>
  );
}

function DayDetail({
  date,
  tasks,
  colorMap,
  onClose,
}: {
  date: Date;
  tasks: CalendarTaskItem[];
  colorMap: Map<number, string>;
  onClose: () => void;
}) {
  const label = `${date.getMonth() + 1}月${date.getDate()}日（${WEEKDAYS[date.getDay()]}）`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="fixed inset-x-0 bottom-0 z-50 md:static md:mt-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="bg-white/95 backdrop-blur-xl rounded-t-[32px] md:rounded-[24px] shadow-2xl border border-white/60 px-5 pt-5 pb-6 max-h-[60vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800">{label}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xs"
          >
            ✕
          </button>
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">この日のタスクはありません</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task, i) => {
              const color =
                task.user_id != null ? (colorMap.get(task.user_id) ?? 'bg-gray-300') : 'bg-gray-300';
              const isDone = task.status === 'done';
              return (
                <li
                  key={i}
                  className="flex items-center gap-3 bg-[#FAFFFD] rounded-2xl px-4 py-3"
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color} ${isDone ? '' : 'opacity-40'}`} />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isDone ? 'text-gray-700' : 'text-gray-400'
                      }`}
                    >
                      {isDone ? '' : '[ 予定 ] '}
                      {task.title}
                    </p>
                    {task.category && (
                      <span className="text-[10px] text-[#2EC58A] font-medium">{task.category}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{task.user_name}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: calendarDays = [], isLoading } = useCalendar(year, month);

  const colorMap = useMemberColorMap(calendarDays);

  // calendarDays を日付インデックスに変換
  const dayTaskMap = new Map<string, CalendarTaskItem[]>();
  for (const d of calendarDays) {
    if (d.date) {
      dayTaskMap.set(d.date, d.tasks ?? []);
    }
  }

  // カレンダーグリッド生成
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startPad = firstDay.getDay(); // 最初の空白セル数
  const cells: Array<Date | null> = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month - 1, i + 1)),
  ];
  // 6行になるよう末尾を埋める
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  const selectedTasks = selectedDate
    ? (dayTaskMap.get(toLocalDateStr(selectedDate)) ?? [])
    : [];

  return (
    <AppShell>
      <div className="px-4 md:px-6 md:max-w-2xl">
        {/* ヘッダー */}
        <header
          className="flex items-center justify-between mb-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
        >
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-2xl bg-white/80 border border-white/60 shadow-sm flex items-center justify-center text-gray-500 hover:text-[#15A06E] transition-colors"
          >
            ‹
          </button>
          <h2 className="text-base font-bold text-gray-800">
            {year}年 {month}月
          </h2>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-2xl bg-white/80 border border-white/60 shadow-sm flex items-center justify-center text-gray-500 hover:text-[#15A06E] transition-colors"
          >
            ›
          </button>
        </header>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w, i) => (
            <span
              key={w}
              className={`text-center text-[11px] font-semibold py-1 ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              {w}
            </span>
          ))}
        </div>

        {/* カレンダーグリッド */}
        {isLoading ? (
          <div className="text-center py-16 text-gray-400 text-sm">読み込み中...</div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="min-h-[52px]" />;
              }
              const dateStr = toLocalDateStr(date);
              const tasks = dayTaskMap.get(dateStr) ?? [];
              const isToday =
                date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate();
              const isSelected =
                selectedDate != null && toLocalDateStr(selectedDate) === dateStr;

              return (
                <div
                  key={dateStr}
                  className={`rounded-2xl ${isSelected ? 'ring-2 ring-[#2EC58A]' : ''}`}
                >
                  <DayCell
                    date={date}
                    tasks={tasks}
                    isCurrentMonth={true}
                    isToday={isToday}
                    colorMap={colorMap}
                    onClick={() =>
                      setSelectedDate(isSelected ? null : date)
                    }
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* メンバー凡例 */}
        {colorMap.size > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from(colorMap.entries()).map(([uid, color]) => {
              const name = calendarDays
                .flatMap((d) => d.tasks ?? [])
                .find((t) => t.user_id === uid)?.user_name;
              return (
                <div key={uid} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-xs text-gray-500">{name}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* 日別タスク詳細 */}
        <AnimatePresence>
          {selectedDate && (
            <DayDetail
              date={selectedDate}
              tasks={selectedTasks}
              colorMap={colorMap}
              onClose={() => setSelectedDate(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
