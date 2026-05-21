import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('通知機能', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('通知ページにアクセスできる', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.getByRole('heading', { name: '通知' }).first()).toBeVisible();
    await expect(page.getByText('もらった感謝スタンプ').filter({ visible: true })).toBeVisible();
  });

  test('通知がない場合は空状態メッセージが表示される', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForTimeout(2000);
    const hasNotifications = await page.locator('.rounded-\\[24px\\]').count() > 0;
    const hasEmpty = await page.getByText('まだ通知はありません').isVisible().catch(() => false);
    expect(hasNotifications || hasEmpty).toBeTruthy();
  });

  test('通知カードにコンテンツが表示される', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForTimeout(2000);
    const cards = page.locator('.rounded-\\[24px\\]');
    const count = await cards.count();
    if (count > 0) {
      const firstCard = cards.first();
      const text = await firstCard.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('サイドバーの通知リンクから遷移できる（デスクトップ）', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.locator('aside').getByRole('link', { name: '通知' }).click({ force: true });
    await expect(page).toHaveURL(/\/notifications/, { timeout: 8000 });
  });
});
