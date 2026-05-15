'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin, useRegister } from '@/hooks/useAuth';

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
      await login.mutateAsync({ email: email as never, password });
      router.replace('/');
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register.mutateAsync({ name, email: email as never, password, role });
      router.replace('/family/setup');
    } catch {
      setError('登録に失敗しました。入力内容を確認してください');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-50 to-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🍏</div>
          <h1 className="text-2xl font-bold text-gray-800">enman</h1>
          <p className="text-sm text-gray-500 mt-1">家族の感謝を可視化するアプリ</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">お名前</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="田中太郎"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">役割</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                  >
                    <option value="">選択してください</option>
                    {['パパ', 'ママ', '長男', '長女', '次男', '次女', 'その他'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'register' ? '8文字以上' : ''}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={login.isPending || register.isPending}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {login.isPending || register.isPending
                ? '処理中...'
                : tab === 'login' ? 'ログイン' : '登録する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
