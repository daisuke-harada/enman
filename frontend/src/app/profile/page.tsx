'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import { useCurrentUser, useUpdateProfile } from '@/hooks/useCurrentUser';
import { useLogout } from '@/hooks/useAuth';

export default function ProfilePage() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setRole(user.role ?? '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({ name, role });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.replace('/login');
  };

  const handleCopyInviteCode = () => {
    if (typeof window !== 'undefined' && user?.invite_code) {
      navigator.clipboard.writeText(user.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
              <span className="text-base">👤</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">マイページ</h1>
          </div>
        </div>
        <h1 className="hidden md:block text-2xl font-bold text-gray-800">マイページ</h1>
      </header>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400 text-sm">読み込み中...</div>
      ) : (
        <div className="px-4 md:px-6 md:max-w-2xl space-y-4">
          {/* アイコン & ポイント */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 shadow-card border border-white/60 flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#76C893]/30 to-[#52B788]/20 flex items-center justify-center text-4xl shadow-inner">
              👤
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800 text-lg">{user?.name}</p>
              <span className="inline-block mt-1 text-xs font-medium text-[#76C893] bg-[#76C893]/10 px-3 py-0.5 rounded-full">
                {user?.role}
              </span>
            </div>
            <div className="w-full bg-gradient-to-r from-[#FF9E00]/10 to-[#FFB74D]/10 border border-[#FF9E00]/20 rounded-2xl px-5 py-3 text-center">
              <p className="text-xs text-[#FF9E00] font-semibold mb-0.5">円満ポイント</p>
              <p className="text-3xl font-bold text-[#FF9E00]">{user?.enman_point ?? 0}
                <span className="text-base font-semibold ml-1">pt</span>
              </p>
            </div>
          </motion.div>

          {/* プロフィール編集 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08, ease: 'easeOut' }}
            className="bg-white/80 backdrop-blur-md rounded-[28px] p-5 shadow-card border border-white/60"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">プロフィール編集</p>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="profile-name" className="block text-xs font-semibold text-gray-500 mb-1.5">お名前</label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40 focus:border-[#76C893] transition-all"
                />
              </div>
              <div>
                <label htmlFor="profile-role" className="block text-xs font-semibold text-gray-500 mb-1.5">役割</label>
                <select
                  id="profile-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40 focus:border-[#76C893] transition-all"
                >
                  {['パパ', 'ママ', '長男', '長女', '次男', '次女', 'その他'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <motion.button
                type="submit"
                disabled={updateProfile.isPending}
                whileTap={{ scale: 0.97 }}
                className="w-full bg-gradient-to-br from-[#76C893] to-[#52B788] text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-green-200/50 transition-opacity disabled:opacity-60"
              >
                <AnimatePresence mode="wait">
                  {saved ? (
                    <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      ✓ 保存しました
                    </motion.span>
                  ) : updateProfile.isPending ? (
                    <motion.span key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      保存中...
                    </motion.span>
                  ) : (
                    <motion.span key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      保存する
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>
          </motion.div>

          {/* 家族グループ情報 */}
          {user?.family_id && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.12, ease: 'easeOut' }}
              className="bg-white/80 backdrop-blur-md rounded-[28px] p-5 shadow-card border border-white/60"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">家族グループ</p>
              <motion.button
                onClick={handleCopyInviteCode}
                whileTap={{ scale: 0.97 }}
                className="w-full border-2 border-dashed border-[#76C893]/30 rounded-2xl py-4 text-sm text-[#52B788] font-medium hover:bg-[#76C893]/5 transition-colors"
              >
                {copied ? '✓ コピーしました！' : '📋 招待コードをコピー（家族を誘う）'}
              </motion.button>
            </motion.div>
          )}

          {/* ログアウト（モバイルのみ） */}
          <motion.button
            onClick={handleLogout}
            disabled={logout.isPending}
            whileTap={{ scale: 0.97 }}
            className="w-full border border-red-200 text-red-400 font-medium py-3.5 rounded-2xl text-sm hover:bg-red-50/80 transition-colors disabled:opacity-50 md:hidden"
          >
            {logout.isPending ? 'ログアウト中...' : '↩ ログアウト'}
          </motion.button>
        </div>
      )}
    </AppShell>
  );
}
