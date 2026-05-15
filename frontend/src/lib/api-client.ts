// アプリ起動時に一度だけ import し、生成済み axios client の baseURL を設定する。
// NEXT_PUBLIC_API_BASE_URL が未設定の場合はローカル開発用の Go サーバーを指す。
import { client } from '@/api-client/client.gen';

client.setConfig({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:1099',
});

export { client };
