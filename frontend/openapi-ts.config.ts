import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: {
    // バックエンドの make gen で生成される resolved spec を参照
    path: '../api/resolved/openapi/openapi.yaml',
  },
  output: 'src/api-client',
  plugins: [
    '@hey-api/client-axios',
    '@hey-api/typescript',
    '@hey-api/sdk',
  ],
});
