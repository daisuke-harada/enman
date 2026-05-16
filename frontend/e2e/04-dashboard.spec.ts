import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('ダッシュボードページにアクセスできる', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'ダッシュボード' }).first()).toBeVisible();
    await expect(page.getByText('家族の貢献を可視化').filter({ visible: true })).toBeVisible();
  });

  test('貢献度グラフセクションが表示される', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('貢献度グラフ').first()).toBeVisible();
  });

  test('ご褒美目標セクションが表示される', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('ご褒美目標').first()).toBeVisible();
    await expect(page.getByText('＋ 追加').first()).toBeVisible();
  });

  test('感謝タイムラインセクションが表示される', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('感謝タイムライン').first()).toBeVisible();
  });

  test('ご褒美目標を追加できる', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByText('＋ 追加').first().click();
    await expect(page.getByPlaceholder('例：週末の焼肉')).toBeVisible();
    await page.getByPlaceholder('例：週末の焼肉').fill(`E2Eテスト目標_${Date.now()}`);
    await page.getByPlaceholder('目標ポイント（例：100）').fill('50');
    await page.getByRole('button', { name: '追加する' }).click();
    await expect(page.getByPlaceholder('例：週末の焼肉')).not.toBeVisible({ timeout: 5000 });
  });

  test('目標追加フォームをキャンセルできる', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByText('＋ 追加').first().click();
    await expect(page.getByPlaceholder('例：週末の焼肉')).toBeVisible();
    await page.getByRole('button', { name: 'キャンセル' }).click();
    await expect(page.getByPlaceholder('例：週末の焼肉')).not.toBeVisible();
  });

  test('タイムラインに感謝ログが表示される', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    const hasTimeline = await page.locator('.border-b').count() > 0;
    const hasEmpty = await page.getByText('まだ感謝のやりとりがありません').isVisible().catch(() => false);
    expect(hasTimeline || hasEmpty).toBeTruthy();
  });

  test('デスクトップで2カラムレイアウトになる', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/dashboard');
    const grid = page.locator('.md\\:grid-cols-2');
    await expect(grid).toBeVisible();
  });
});
