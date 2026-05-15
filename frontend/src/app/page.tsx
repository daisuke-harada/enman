'use client';

import { useHealth } from '@/hooks/useHealth';

export default function Home() {
  const { data, isPending, isError } = useHealth();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Go + Next.js Template</h1>

        <div className="bg-gray-50 rounded-xl p-6 space-y-3 text-left">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Backend Health
          </h2>
          {isPending && (
            <p className="text-gray-400 text-sm">接続中...</p>
          )}
          {isError && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <p className="text-red-600 text-sm">バックエンドに接続できません</p>
            </div>
          )}
          {data && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <p className="text-green-700 text-sm font-mono">
                status: {data.status}
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-6 text-left space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            開発の始め方
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>
              <code className="bg-white px-1.5 py-0.5 rounded border text-xs">api/OpenAPI.yaml</code>
              {' '}を編集して API を設計する
            </li>
            <li>ルートで
              {' '}<code className="bg-white px-1.5 py-0.5 rounded border text-xs">make gen</code>
              {' '}を実行して Go コードと TypeScript 型を同時生成する
            </li>
            <li>
              <code className="bg-white px-1.5 py-0.5 rounded border text-xs">frontend/src/hooks/</code>
              {' '}に useQuery / useMutation フックを実装する
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}
