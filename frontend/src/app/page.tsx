'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useCompleteTask } from '@/hooks/useTasks';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSendAppreciation } from '@/hooks/useAppreciations';
import { useCalendar, useCreateRecurrenceRule } from '@/hooks/useCalendar';
import type { TaskResponse, CalendarTaskItem } from '@/api-client/types.gen';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const WEEKDAY_LABELS_SHORT = ['日', '月', '火', '水', '木', '金', '土'];
const NTH_LABELS = ['第1', '第2', '第3', '第4', '第5'];
type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';
type MonthlyMode = 'date' | 'weekday';

async function launchConfetti() {
  const confetti = (await import('canvas-confetti')).default;
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#76C893', '#FF9E00', '#FFB74D', '#A8DDB5', '#FFC1CC', '#FFD700'], shapes: ['circle', 'square'], scalar: 0.9 });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getWeekDays(pivot: Date): Date[] {
  const sunday = new Date(pivot);
  sunday.setDate(pivot.getDate() - pivot.getDay());
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(sunday); d.setDate(sunday.getDate() + i); return d; });
}

// ---- ボトムシート共通 ----
function BottomSheet({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full bg-white rounded-t-[32px] px-5 pt-5 shadow-2xl overflow-y-auto max-h-[92vh]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs hover:text-gray-600">✕</button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ---- 繰り返し設定フォーム（共通部品）----
function RecurrenceFields({
  recurrence, setRecurrence,
  weekday, setWeekday,
  monthlyMode, setMonthlyMode,
  dayOfMonth, setDayOfMonth,
  weekOfMonth, setWeekOfMonth,
  monthlyWeekday, setMonthlyWeekday,
  startDate, setStartDate,
}: {
  recurrence: RecurrenceType; setRecurrence: (v: RecurrenceType) => void;
  weekday: number; setWeekday: (v: number) => void;
  monthlyMode: MonthlyMode; setMonthlyMode: (v: MonthlyMode) => void;
  dayOfMonth: number; setDayOfMonth: (v: number) => void;
  weekOfMonth: number; setWeekOfMonth: (v: number) => void;
  monthlyWeekday: number; setMonthlyWeekday: (v: number) => void;
  startDate: string; setStartDate: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      {/* 繰り返しタイプ */}
      <div>
        <p className="text-xs font-medium text-gray-400 mb-2">繰り返し</p>
        <div className="flex gap-1.5">
          {(['none', 'daily', 'weekly', 'monthly'] as RecurrenceType[]).map((t) => (
            <button key={t} type="button" onClick={() => setRecurrence(t)}
              className={`flex-1 py-2 rounded-2xl text-xs font-semibold transition-all ${recurrence === t ? 'bg-gradient-to-r from-[#76C893] to-[#52B788] text-white shadow-sm' : 'bg-gray-100 text-gray-500'}`}>
              {t === 'none' ? 'なし' : t === 'daily' ? '毎日' : t === 'weekly' ? '毎週' : '毎月'}
            </button>
          ))}
        </div>
      </div>

      {/* 毎週: 曜日 */}
      {recurrence === 'weekly' && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">曜日</p>
          <div className="flex gap-1">
            {WEEKDAY_LABELS_SHORT.map((label, idx) => (
              <button key={idx} type="button" onClick={() => setWeekday(idx)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${weekday === idx ? 'bg-[#76C893] text-white' : 'bg-gray-100 text-gray-500'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 毎月: 日付 vs 曜日指定 */}
      {recurrence === 'monthly' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['date', 'weekday'] as MonthlyMode[]).map((m) => (
              <button key={m} type="button" onClick={() => setMonthlyMode(m)}
                className={`flex-1 py-2.5 rounded-2xl text-xs font-semibold transition-all ${monthlyMode === m ? 'bg-gradient-to-r from-[#76C893] to-[#52B788] text-white shadow-sm' : 'bg-gray-100 text-gray-500'}`}>
                {m === 'date' ? '毎月○日' : '毎月 第△曜日'}
              </button>
            ))}
          </div>
          {monthlyMode === 'date' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">毎月</span>
              <input type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="w-16 bg-[#FFFAF0] border border-gray-200/80 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#76C893]/40" />
              <span className="text-xs text-gray-400">日</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1.5">第N週</p>
                <div className="flex gap-1.5">
                  {NTH_LABELS.map((label, idx) => (
                    <button key={idx} type="button" onClick={() => setWeekOfMonth(idx + 1)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${weekOfMonth === idx + 1 ? 'bg-[#76C893] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1.5">曜日</p>
                <div className="flex gap-1">
                  {WEEKDAY_LABELS_SHORT.map((label, idx) => (
                    <button key={idx} type="button" onClick={() => setMonthlyWeekday(idx)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${monthlyWeekday === idx ? 'bg-[#76C893] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 開始日（繰り返しあり時のみ） */}
      {recurrence !== 'none' && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1.5">開始日</p>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40" />
        </div>
      )}
    </div>
  );
}

// ---- タスク作成モーダル ----
function TaskCreateModal({ selectedDate, onClose }: { selectedDate: Date; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [weekday, setWeekday] = useState(1);
  const [monthlyMode, setMonthlyMode] = useState<MonthlyMode>('date');
  const [dayOfMonth, setDayOfMonth] = useState(selectedDate.getDate());
  const [weekOfMonth, setWeekOfMonth] = useState(1);
  const [monthlyWeekday, setMonthlyWeekday] = useState(1);
  const [startDate, setStartDate] = useState(() => selectedDate.toISOString().slice(0, 10));
  const [error, setError] = useState('');

  const createTask = useCreateTask();
  const createRule = useCreateRecurrenceRule();
  const isPending = createTask.isPending || createRule.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('タスク名を入力してください'); return; }
    setError('');
    try {
      if (recurrence === 'none') {
        await createTask.mutateAsync({ title: title.trim() });
      } else if (recurrence === 'daily') {
        await createRule.mutateAsync({ title: title.trim(), frequency: 'daily', start_date: startDate });
      } else if (recurrence === 'weekly') {
        await createRule.mutateAsync({ title: title.trim(), frequency: 'weekly', start_date: startDate, day_of_week: weekday });
      } else {
        const body = monthlyMode === 'date'
          ? { title: title.trim(), frequency: 'monthly' as const, start_date: startDate, day_of_month: dayOfMonth }
          : { title: title.trim(), frequency: 'monthly' as const, start_date: startDate, day_of_week: monthlyWeekday, week_of_month: weekOfMonth };
        await createRule.mutateAsync(body);
      }
      onClose();
    } catch {
      setError('作成に失敗しました');
    }
  };

  return (
    <BottomSheet onClose={onClose} title="タスクを追加">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setError(''); }}
          placeholder="例：皿洗い" autoFocus
          className="w-full bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40 focus:border-[#76C893] transition-all" />

        <RecurrenceFields
          recurrence={recurrence} setRecurrence={setRecurrence}
          weekday={weekday} setWeekday={setWeekday}
          monthlyMode={monthlyMode} setMonthlyMode={setMonthlyMode}
          dayOfMonth={dayOfMonth} setDayOfMonth={setDayOfMonth}
          weekOfMonth={weekOfMonth} setWeekOfMonth={setWeekOfMonth}
          monthlyWeekday={monthlyWeekday} setMonthlyWeekday={setMonthlyWeekday}
          startDate={startDate} setStartDate={setStartDate}
        />

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs text-red-500 bg-red-50 rounded-2xl px-4 py-2.5">{error}</motion.p>
          )}
        </AnimatePresence>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-gray-500 bg-gray-100">キャンセル</button>
          <motion.button type="submit" disabled={isPending} whileTap={{ scale: 0.96 }}
            className="flex-1 bg-gradient-to-br from-[#76C893] to-[#52B788] text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-green-200/50 disabled:opacity-60">
            {isPending ? '作成中...' : recurrence === 'none' ? '追加する' : '繰り返し作成'}
          </motion.button>
        </div>
      </form>
    </BottomSheet>
  );
}

// ---- タスク編集モーダル ----
function TaskEditModal({ task, onClose }: { task: TaskResponse | CalendarTaskItem; onClose: () => void }) {
  const title = 'title' in task ? (task.title ?? '') : '';
  const [editTitle, setEditTitle] = useState(title);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const taskId = 'id' in task ? task.id : ('task_id' in task ? task.task_id : undefined);
  const isPending = updateTask.isPending || deleteTask.isPending;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !taskId) return;
    try {
      await updateTask.mutateAsync({ taskId, title: editTitle.trim(), category: task.category });
      onClose();
    } catch { setError('更新に失敗しました'); }
  };

  const handleDelete = async () => {
    if (!taskId) return;
    try {
      await deleteTask.mutateAsync(taskId);
      onClose();
    } catch { setError('削除に失敗しました'); }
  };

  if (!taskId) return null;

  return (
    <BottomSheet onClose={onClose} title="タスクを編集">
      {confirmDelete ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center py-2">「{title}」を削除しますか？</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-gray-500 bg-gray-100">戻る</button>
            <motion.button onClick={handleDelete} disabled={isPending} whileTap={{ scale: 0.96 }}
              className="flex-1 bg-red-500 text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-60">
              {isPending ? '削除中...' : '削除する'}
            </motion.button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <input type="text" value={editTitle} onChange={(e) => { setEditTitle(e.target.value); setError(''); }} autoFocus
            className="w-full bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40 transition-all" />
          {error && <p className="text-xs text-red-500 bg-red-50 rounded-2xl px-4 py-2.5">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setConfirmDelete(true)} className="py-3.5 px-4 rounded-2xl text-sm font-semibold text-red-400 hover:bg-red-50 transition-colors">削除</button>
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-gray-500 bg-gray-100">キャンセル</button>
            <motion.button type="submit" disabled={isPending} whileTap={{ scale: 0.96 }}
              className="flex-1 bg-gradient-to-br from-[#76C893] to-[#52B788] text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-green-200/50 disabled:opacity-60">
              {isPending ? '保存中...' : '保存する'}
            </motion.button>
          </div>
        </form>
      )}
    </BottomSheet>
  );
}

// ---- 月カレンダーポップアップ ----
function MonthCalendarSheet({ year, month, dayTaskMap, selectedDate, onSelectDate, onPrevMonth, onNextMonth, onClose }: {
  year: number; month: number;
  dayTaskMap: Map<string, CalendarTaskItem[]>;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onPrevMonth: () => void; onNextMonth: () => void;
  onClose: () => void;
}) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const cells: Array<Date | null> = [
    ...Array(firstDay.getDay()).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month - 1, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <BottomSheet onClose={onClose} title={`${year}年 ${month}月`}>
      <div className="flex items-center justify-between mb-3 -mt-2">
        <button onClick={onPrevMonth} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#52B788] text-lg">‹</button>
        <span className="text-sm font-bold text-gray-700">{year}年 {month}月</span>
        <button onClick={onNextMonth} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#52B788] text-lg">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w, i) => (
          <span key={w} className={`text-center text-[10px] font-semibold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((date, idx) => {
          if (!date) return <div key={`e-${idx}`} className="min-h-[40px]" />;
          const dateStr = date.toISOString().slice(0, 10);
          const tasks = dayTaskMap.get(dateStr) ?? [];
          const isToday = dateStr === todayStr;
          const isSelected = isSameDay(date, selectedDate);
          const hasDone = tasks.some(t => t.status === 'done');
          const hasPending = tasks.some(t => t.status === 'pending');
          return (
            <button key={dateStr} onClick={() => { onSelectDate(date); onClose(); }}
              className={`flex flex-col items-center py-1 rounded-xl min-h-[40px] transition-all active:scale-95 ${isSelected ? 'bg-[#76C893]/15 ring-1 ring-[#76C893]' : isToday ? 'bg-[#E8F8EE]' : 'hover:bg-[#F0FBF4]'}`}>
              <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full leading-none ${isToday ? 'bg-gradient-to-br from-[#76C893] to-[#52B788] text-white text-[10px]' : 'text-gray-700'}`}>
                {date.getDate()}
              </span>
              <div className="flex gap-0.5 mt-0.5 h-1.5 items-center">
                {hasDone && <span className="w-1 h-1 rounded-full bg-[#76C893]" />}
                {hasPending && <span className="w-1 h-1 rounded-full bg-[#76C893]/30" />}
              </div>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

// ---- コメントフォーム ----
function CommentForm({ taskId, currentUserId, doneBy, comments }: {
  taskId: number; currentUserId: number; doneBy?: number | null;
  comments?: { from_user_id?: number; from_user_name?: string; message?: string | null }[];
}) {
  const sendAppreciation = useSendAppreciation();
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  if (!doneBy || doneBy === currentUserId) return null;
  const alreadySent = comments?.some(c => c.from_user_id === currentUserId) ?? false;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sendAppreciation.isPending) return;
    await sendAppreciation.mutateAsync({ taskId, body: { message: text.trim() } });
    setText(''); setSent(true);
  };
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pl-4 space-y-1.5">
      {comments && comments.length > 0 && (
        <div className="space-y-1">
          {comments.map((c, i) => (
            <p key={i} className="text-xs text-gray-500"><span className="font-semibold text-[#52B788]">{c.from_user_name}</span>{': '}{c.message}</p>
          ))}
        </div>
      )}
      {!alreadySent && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="コメントを送る..." maxLength={255}
            className="flex-1 bg-[#F7FDF9] border border-[#76C893]/30 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#76C893]/50" />
          <motion.button type="submit" disabled={!text.trim() || sendAppreciation.isPending} whileTap={{ scale: 0.95 }} className="text-xs font-semibold text-[#52B788] disabled:opacity-40 px-2">
            {sent ? '✓' : '送信'}
          </motion.button>
        </form>
      )}
    </motion.div>
  );
}

// ---- メインページ ----
export default function HomePage() {
  const router = useRouter();
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResponse | CalendarTaskItem | null>(null);

  const { data: user } = useCurrentUser();
  const completeTask = useCompleteTask();
  const createTask = useCreateTask();

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
  const { data: calendarDays = [], isLoading } = useCalendar(calYear, calMonth);

  const dayTaskMap = new Map<string, CalendarTaskItem[]>();
  for (const d of calendarDays) { if (d.date) dayTaskMap.set(d.date, d.tasks ?? []); }

  const selectedDateStr = selectedDate.toISOString().slice(0, 10);
  const dayTasks = dayTaskMap.get(selectedDateStr) ?? [];

  // 選択日が変わったら対応月をフェッチ
  useEffect(() => {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth() + 1;
    if (y !== calYear || m !== calMonth) { setCalYear(y); setCalMonth(m); }
  }, [selectedDate]);

  useEffect(() => {
    if (user && !user.family_id) router.replace('/family/setup');
  }, [user, router]);

  const handleComplete = useCallback(async (task: CalendarTaskItem) => {
    try {
      let taskId = task.task_id;
      if (!taskId) {
        // 仮想インスタンス → 実体化してから完了
        const created = await createTask.mutateAsync({
          title: task.title!,
          category: task.category ?? undefined,
          recurrence_rule_id: task.recurrence_rule_id ?? undefined,
          scheduled_date: task.scheduled_date ?? undefined,
        });
        taskId = created?.id ?? null;
      }
      if (taskId) {
        await completeTask.mutateAsync(taskId);
        await launchConfetti();
      }
    } catch { /* mutation handles error */ }
  }, [completeTask, createTask]);

  const prevMonth = () => { if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); } else setCalMonth(m => m + 1); };

  const weekDays = getWeekDays(selectedDate);
  const weekRef = useRef<HTMLDivElement>(null);

  const goWeek = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta * 7);
    setSelectedDate(d);
  };

  // 週ラベル
  const weekLabel = (() => {
    const s = weekDays[0]; const e = weekDays[6];
    if (s.getMonth() === e.getMonth()) return `${s.getMonth() + 1}月`;
    return `${s.getMonth() + 1}月〜${e.getMonth() + 1}月`;
  })();

  return (
    <AppShell>
      {/* ヘッダー */}
      <header className="px-4 pb-3 bg-transparent" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#76C893] to-[#52B788] flex items-center justify-center shadow-sm md:hidden">
              <span className="text-sm">🍏</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">enman</h1>
              {user && <p className="text-[10px] text-gray-400 leading-tight">{user.name}（{user.role}）</p>}
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 md:max-w-2xl space-y-3 pb-6">

        {/* 週バー */}
        <div className="bg-white rounded-[24px] px-3 py-3 shadow-card border border-white/60">
          {/* 週ナビ */}
          <div className="flex items-center justify-between mb-2 px-1">
            <button onClick={() => goWeek(-1)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#52B788] hover:bg-[#F0FBF4] transition-colors text-lg">‹</button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600">{weekLabel}</span>
              <button onClick={() => setSelectedDate(new Date())}
                className="text-[10px] font-semibold text-[#52B788] bg-[#76C893]/10 px-2 py-0.5 rounded-full hover:bg-[#76C893]/20 transition-colors">今日</button>
              <button onClick={() => setShowCalendar(true)}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#52B788] hover:bg-[#F0FBF4] transition-colors text-base">📅</button>
            </div>
            <button onClick={() => goWeek(1)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#52B788] hover:bg-[#F0FBF4] transition-colors text-lg">›</button>
          </div>

          {/* 7日グリッド */}
          <div ref={weekRef} className="grid grid-cols-7 gap-0.5">
            {weekDays.map((date) => {
              const dateStr = date.toISOString().slice(0, 10);
              const tasks = dayTaskMap.get(dateStr) ?? [];
              const isToday = isSameDay(date, today);
              const isSelected = isSameDay(date, selectedDate);
              const hasDone = tasks.some(t => t.status === 'done');
              const hasPending = tasks.some(t => t.status === 'pending');
              return (
                <motion.button key={dateStr} onClick={() => setSelectedDate(date)} whileTap={{ scale: 0.92 }}
                  className={`flex flex-col items-center py-2 rounded-2xl transition-all ${isSelected ? 'bg-gradient-to-b from-[#76C893]/20 to-[#52B788]/10 ring-1 ring-[#76C893]/60' : isToday ? 'bg-[#E8F8EE]' : 'hover:bg-[#F7FDF9]'}`}>
                  <span className={`text-[10px] font-semibold mb-0.5 ${date.getDay() === 0 ? 'text-red-400' : date.getDay() === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                    {WEEKDAYS[date.getDay()]}
                  </span>
                  <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full leading-none ${isToday ? 'bg-gradient-to-br from-[#76C893] to-[#52B788] text-white shadow-sm' : isSelected ? 'text-[#52B788]' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </span>
                  <div className="flex gap-0.5 mt-1 h-1.5 items-center">
                    {hasDone && <span className="w-1.5 h-1.5 rounded-full bg-[#76C893]" />}
                    {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-[#76C893]/30" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 日付ラベル */}
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-bold text-gray-800">
            {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日（{WEEKDAYS[selectedDate.getDay()]}）
            {isSameDay(selectedDate, today) && <span className="ml-2 text-[10px] text-[#52B788] font-semibold bg-[#76C893]/10 px-2 py-0.5 rounded-full">今日</span>}
          </p>
          <span className="text-xs text-gray-400">{dayTasks.length > 0 ? `${dayTasks.filter(t => t.status === 'done').length} / ${dayTasks.length} 完了` : ''}</span>
        </div>

        {/* タスクリスト */}
        {isLoading ? (
          <div className="text-center py-10 text-gray-400 text-sm">読み込み中...</div>
        ) : dayTasks.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm text-gray-400">この日のタスクはありません</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2.5">
              {dayTasks.map((task, i) => {
                const isDone = task.status === 'done';
                const isVirtual = !task.task_id;
                const canEdit = !!task.task_id;
                return (
                  <motion.div key={`${task.recurrence_rule_id ?? 'task'}-${i}`}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.03 }}
                    className={`bg-white/85 backdrop-blur-md rounded-[22px] px-4 py-3.5 shadow-card border flex items-center gap-3 ${isDone ? 'border-[#76C893]/20' : 'border-white/60'}`}>

                    {/* DONE ボタン */}
                    <motion.button
                      onClick={() => !isDone && handleComplete(task)}
                      whileTap={!isDone ? { scale: 0.85 } : {}}
                      className={`shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                        isDone
                          ? 'border-[#76C893] bg-gradient-to-br from-[#76C893] to-[#52B788] shadow-md shadow-green-200/40'
                          : isVirtual
                          ? 'border-gray-200 hover:border-[#76C893]/60 hover:bg-[#76C893]/5'
                          : 'border-[#76C893]/50 hover:border-[#76C893] hover:bg-[#76C893]/10'
                      }`}>
                      {isDone && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-white text-sm font-bold">✓</motion.span>}
                    </motion.button>

                    {/* タスク情報 */}
                    <button onClick={() => canEdit && setEditingTask(task)} className={`flex-1 min-w-0 text-left ${canEdit ? '' : 'cursor-default'}`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</p>
                        {task.recurrence_rule_id && <span className="shrink-0 text-gray-300 text-xs">🔁</span>}
                        {isVirtual && !isDone && <span className="shrink-0 text-[9px] text-gray-300 border border-gray-200 px-1.5 py-0.5 rounded-full font-medium">予定</span>}
                      </div>
                      {task.category && <span className="text-[10px] text-[#76C893] font-medium">{task.category}</span>}
                    </button>

                    {/* DONE ラベル / 担当者名 */}
                    <div className="shrink-0 text-right">
                      {isDone
                        ? <span className="text-[10px] font-bold text-[#52B788] bg-[#76C893]/10 px-2 py-1 rounded-full">DONE</span>
                        : task.user_name && <span className="text-[10px] text-gray-400">{task.user_name}</span>
                      }
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* タスク追加ボタン */}
        <motion.button onClick={() => setShowCreate(true)} whileTap={{ scale: 0.97 }}
          className="w-full bg-gradient-to-r from-[#76C893] to-[#52B788] text-white font-bold py-3.5 rounded-[22px] flex items-center justify-center gap-2 shadow-lg shadow-green-200/50 mt-1">
          <span className="text-xl leading-none font-light">+</span>
          <span className="text-sm">タスクを追加</span>
        </motion.button>
      </div>

      {/* モーダル類 */}
      <AnimatePresence>
        {showCreate && <TaskCreateModal selectedDate={selectedDate} onClose={() => setShowCreate(false)} />}
        {editingTask && <TaskEditModal task={editingTask} onClose={() => setEditingTask(null)} />}
        {showCalendar && (
          <MonthCalendarSheet
            year={calYear} month={calMonth} dayTaskMap={dayTaskMap}
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
            onPrevMonth={prevMonth} onNextMonth={nextMonth}
            onClose={() => setShowCalendar(false)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
