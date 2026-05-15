import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',      // TODO: アプリ固有の Bundle ID に変更する
  appName: 'App',                // TODO: アプリ名に変更する
  webDir: 'out',                 // next build の静的出力先と一致させること

  // iOS 実機・シミュレーターで開発サーバーに接続する場合はコメントアウトを外す
  // （本番ビルド時は削除すること）
  // server: {
  //   url: 'http://192.168.x.x:3000',
  //   cleartext: true,
  // },
};

export default config;
