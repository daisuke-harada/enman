import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('ナビゲーション', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('モバイル BottomNav', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('BottomNavが表示される', async ({ page }) => {
      await expect(page.locator('nav').filter({ hasText: 'タスク' }).last()).toBeVisible();
    });

    test('タスクタブに遷移できる', async ({ page }) => {
      await page.getByRole('link', { name: 'タスク' }).first().click({ force: true });
      await expect(page).toHaveURL((url) => url.pathname === '/');
    });

    test('統計タブに遷移できる', async ({ page }) => {
      await page.getByRole('link', { name: '統計' }).click({ force: true });
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
    });

    test('マイページタブに遷移できる', async ({ page }) => {
      // TanStack Query DevToolsが右下をインターセプトするため evaluateでクリック
      await page.evaluate(() => {
        const nav = document.querySelector('nav.fixed');
        if (!nav) return;
        const link = [...nav.querySelectorAll('a')].find((a) => a.textContent?.includes('マイページ'));
        (link as HTMLElement | undefined)?.click();
      });
      await expect(page).toHaveURL(/\/profile/, { timeout: 8000 });
    });

    test('アクティブタブにインジケータードットが表示される', async ({ page }) => {
      // BottomNav（nav.fixed）内のアクティブドットに限定して確認
      await expect(page.locator('nav.fixed .w-1.h-1.rounded-full')).toBeVisible();
    });
  });

  test.describe('デスクトップ Sidebar', () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test('サイドバーが表示される', async ({ page }) => {
      await expect(page.locator('aside')).toBeVisible();
    });

    test('サイドバーにenmanロゴが表示される', async ({ page }) => {
      await expect(page.locator('aside').getByText('enman')).toBeVisible();
    });

    test('サイドバーから通知ページに遷移できる', async ({ page }) => {
      await page.locator('aside').getByRole('link', { name: '通知' }).click({ force: true });
      await expect(page).toHaveURL(/\/notifications/, { timeout: 8000 });
    });

    test('サイドバーからダッシュボードに遷移できる', async ({ page }) => {
      await page.locator('aside').getByRole('link', { name: 'ダッシュボード' }).click({ force: true });
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
    });

    test('サイドバーにユーザー名が表示される', async ({ page }) => {
      await page.waitForTimeout(2000);
      await expect(page.locator('aside').getByText('タカシ')).toBeVisible({ timeout: 8000 });
    });

    test('サイドバーのログアウトボタンで退出できる', async ({ page }) => {
      await page.locator('aside').getByRole('button', { name: 'ログアウト' }).click();
      await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
    });
  });
});
