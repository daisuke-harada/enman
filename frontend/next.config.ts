import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',       // Capacitor (iOS) 向け静的書き出し
  trailingSlash: true,    // file:// プロトコルでのルーティングに必要
  images: {
    unoptimized: true,    // 静的書き出しでは Next.js 画像最適化が使えないため
  },
  // monorepo 内での配置による workspace root 誤検知を防ぐ
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
