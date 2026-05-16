'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/AuthGuard';
import { useCreateFamily, useJoinFamily } from '@/hooks/useFamily';

export default function FamilySetupPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const createFamily = useCreateFamily();
  const joinFamily = useJoinFamily();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createFamily.mutateAsync(familyName);
      router.replace('/');
    } catch {
      setError('家族グループの作成に失敗しました');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await joinFamily.mutateAsync(inviteCode.toUpperCase());
      router.replace('/');
    } catch {
      setError('招待コードが正しくありません');
    }
  };

  return (
    <AuthGuard>
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(160deg, #FFFAF0 0%, #F0FFF4 50%, #FFF8E7 100%)' }}
      >
        {/* 背景の装飾円 */}
        <div className="fixed top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-[#76C893]/10 blur-3xl pointer-events-none" />
        <div className="fixed bottom-[-60px] left-[-60px] w-56 h-56 rounded-full bg-[#FF9E00]/10 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          {/* アイコン */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#76C893] to-[#52B788] shadow-xl shadow-green-200/50 mb-4"
            >
              <span className="text-4xl">👨‍👩‍👧‍👦</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">家族グループの設定</h1>
            <p className="text-sm text-gray-400 mt-1">グループを作成するか、招待コードで参加しましょう</p>
          </div>

          {/* カード */}
          <div className="bg-white/80 backdrop-blur-md rounded-[32px] shadow-xl shadow-orange-100/40 border border-white/60 overflow-hidden">
            {/* タブ */}
            <div className="flex p-2 gap-1.5 bg-gray-50/60">
              {(['create', 'join'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className={`flex-1 py-2.5 rounded-[20px] text-sm font-semibold transition-all ${
                    tab === t
                      ? 'bg-gradient-to-r from-[#76C893] to-[#52B788] text-white shadow-md shadow-green-200/40'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t === 'create' ? '新しく作る' : '参加する'}
                </button>
              ))}
            </div>

            <div className="p-6">
              {tab === 'create' ? (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label htmlFor="family-name" className="block text-xs font-semibold text-gray-500 mb-1.5">家族グループ名</label>
                    <input
                      id="family-name"
                      type="text"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="田中家"
                      required
                      className="w-full bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40 focus:border-[#76C893] transition-all"
                    />
                  </div>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500 bg-red-50 rounded-2xl px-4 py-2.5"
                    >
                      {error}
                    </motion.p>
                  )}
                  <motion.button
                    type="submit"
                    disabled={createFamily.isPending}
                    whileTap={{ scale: 0.97 }}
                    className="w-full bg-gradient-to-br from-[#76C893] to-[#52B788] text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-green-200/50 disabled:opacity-60"
                  >
                    {createFamily.isPending ? '作成中...' : 'グループを作成する'}
                  </motion.button>
                </form>
              ) : (
                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label htmlFor="invite-code" className="block text-xs font-semibold text-gray-500 mb-1.5">招待コード（12文字）</label>
                    <input
                      id="invite-code"
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="ABC123DEF456"
                      maxLength={12}
                      required
                      className="w-full bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-3 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#76C893]/40 focus:border-[#76C893] transition-all uppercase"
                    />
                  </div>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500 bg-red-50 rounded-2xl px-4 py-2.5"
                    >
                      {error}
                    </motion.p>
                  )}
                  <motion.button
                    type="submit"
                    disabled={joinFamily.isPending}
                    whileTap={{ scale: 0.97 }}
                    className="w-full bg-gradient-to-br from-[#76C893] to-[#52B788] text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-green-200/50 disabled:opacity-60"
                  >
                    {joinFamily.isPending ? '参加中...' : 'グループに参加する'}
                  </motion.button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AuthGuard>
  );
}
