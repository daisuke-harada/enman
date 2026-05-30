'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLogin, useRegister } from '@/hooks/useAuth';
import { EnmanMark } from '@/components/EnmanMark';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const login = useLogin();
  const register = useRegister();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login.mutateAsync({ email, password });
      router.replace('/');
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register.mutateAsync({ name, email, password, role });
      router.replace('/family/setup');
    } catch {
      setError('登録に失敗しました。入力内容を確認してください');
    }
  };

  return (
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
        {/* ロゴ */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#2EC58A] to-[#15A06E] shadow-xl shadow-green-200/50 mb-4"
          >
            <EnmanMark size={56} />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">enman</h1>
          <p className="text-sm text-gray-400 mt-1">家族の感謝を可視化するアプリ</p>
        </div>

        {/* カード */}
        <div className="bg-white/80 backdrop-blur-md rounded-[32px] shadow-xl shadow-orange-100/40 border border-white/60 overflow-hidden">
          {/* タブ */}
          <div className="flex p-2 gap-1.5 bg-gray-50/60">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2.5 rounded-[20px] text-sm font-semibold transition-all ${
                  tab === t
                    ? 'bg-gradient-to-r from-[#76C893] to-[#52B788] text-white shadow-md shadow-green-200/40'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'login' ? 'ログイン' : '新規登録'}
              </button>
            ))}
          </div>

          <form
            onSubmit={tab === 'login' ? handleLogin : handleRegister}
            className="p-6 space-y-4"
          >
            {tab === 'register' && (
              <>
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-gray-500 mb-1.5">お名前</label>
                  <input
                    id="reg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="田中太郎"
                    required
                    className="w-full bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40 focus:border-[#76C893] transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="reg-role" className="block text-xs font-semibold text-gray-500 mb-1.5">役割</label>
                  <input
                    id="reg-role"
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    maxLength={20}
                    placeholder="例：パパ、夫、おとうさん"
                    className="w-full bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40 focus:border-[#76C893] transition-all"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-500 mb-1.5">メールアドレス</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[#FFFAF0] border border-gray-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#76C893]/40 focus:border-[#76C893] transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-500 mb-1.5">パスワード</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'register' ? '8文字以上' : ''}
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
              disabled={login.isPending || register.isPending}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-gradient-to-br from-[#76C893] to-[#52B788] text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-green-200/50 transition-opacity disabled:opacity-60 active:scale-95"
            >
              {login.isPending || register.isPending
                ? '処理中...'
                : tab === 'login' ? 'ログイン' : '登録する'}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
