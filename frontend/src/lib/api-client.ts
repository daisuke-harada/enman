import { client } from '@/api-client/client.gen';
import { auth } from '@/lib/auth';

client.setConfig({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:1099',
});

// Authorizationヘッダーを自動付与
client.instance.interceptors.request.use((config) => {
  const token = auth.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { client };
