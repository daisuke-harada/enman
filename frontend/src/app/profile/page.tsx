'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { BottomNav } from '@/components/BottomNav';
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
    if (typeof window !== 'undefined' && (user as Record<string, unknown>)?.family_invite_code) {
      navigator.clipboard.writeText(String((user as Record<string, unknown>).family_invite_code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen pb-20">
        <header className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
          <h2 className="text-lg font-bold text-gray-800">プロフィール</h2>
        </header>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">読み込み中...</div>
        ) : (
          <div className="px-4 pt-4 space-y-4">
            {/* アイコン */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl">
                👤
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">{user?.name}</p>
                <p className="text-sm text-gray-400">{user?.role}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-center">
                <p className="text-xs text-yellow-600 font-medium">円満ポイント</p>
                <p className="text-2xl font-bold text-yellow-500">{user?.enman_point ?? 0} pt</p>
              </div>
            </div>

            {/* プロフィール編集 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">プロフィール編集</h3>
              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">お名前</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">役割</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    {['パパ', 'ママ', '長男', '長女', '次男', '次女', 'その他'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {saved ? '✓ 保存しました' : updateProfile.isPending ? '保存中...' : '保存する'}
                </button>
              </form>
            </div>

            {/* 家族グループ情報 */}
            {user?.family_id && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">家族グループ</h3>
                <button
                  onClick={handleCopyInviteCode}
                  className="w-full border border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  {copied ? '✓ コピーしました！' : '招待コードをコピー（家族を誘う）'}
                </button>
              </div>
            )}

            {/* ログアウト */}
            <button
              onClick={handleLogout}
              disabled={logout.isPending}
              className="w-full border border-red-200 text-red-500 font-medium py-3 rounded-xl text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {logout.isPending ? 'ログアウト中...' : 'ログアウト'}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </AuthGuard>
  );
}
