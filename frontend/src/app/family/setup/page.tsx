'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-50 to-white">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-2">👨‍👩‍👧‍👦</div>
            <h1 className="text-xl font-bold text-gray-800">家族グループの設定</h1>
            <p className="text-sm text-gray-500 mt-1">グループを作成するか、招待コードで参加しましょう</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {(['create', 'join'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    tab === t ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'
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
                    <label className="block text-xs font-medium text-gray-600 mb-1">家族グループ名</label>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="田中家"
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                  <button
                    type="submit"
                    disabled={createFamily.isPending}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {createFamily.isPending ? '作成中...' : 'グループを作成する'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">招待コード（12文字）</label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="ABC123DEF456"
                      maxLength={12}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-green-400 uppercase"
                    />
                  </div>
                  {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                  <button
                    type="submit"
                    disabled={joinFamily.isPending}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {joinFamily.isPending ? '参加中...' : 'グループに参加する'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
