const ACCESS_TOKEN_KEY = 'enman_access_token';
const REFRESH_TOKEN_KEY = 'enman_refresh_token';

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export const auth = {
  getAccessToken(): string | null {
    return storage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
  },
  getRefreshToken(): string | null {
    return storage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
  },
  setTokens(accessToken: string, refreshToken: string) {
    storage()?.setItem(ACCESS_TOKEN_KEY, accessToken);
    storage()?.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear() {
    storage()?.removeItem(ACCESS_TOKEN_KEY);
    storage()?.removeItem(REFRESH_TOKEN_KEY);
  },
  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  },
};
