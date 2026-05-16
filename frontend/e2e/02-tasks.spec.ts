import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('タスク管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('タスク一覧ページが表示される', async ({ page }) => {
    await expect(page.getByText('これからやること').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('今日終わったこと').first()).toBeVisible();
  });

  test('「これからやること」タブがデフォルトでアクティブ', async ({ page }) => {
    const pendingTab = page.locator('button', { hasText: 'これからやること' });
    await expect(pendingTab).toBeVisible();
    await expect(pendingTab).toHaveClass(/text-white/);
  });

  test('「今日終わったこと」タブに切り替えられる', async ({ page }) => {
    const doneTab = page.locator('button', { hasText: '今日終わったこと' });
    await doneTab.click();
    await expect(doneTab).toHaveClass(/text-white/);
  });

  test('タスクカードまたは空状態が表示される', async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasCards = await page.locator('.bg-white\\/80').count() > 0;
    const hasEmptyState = await page.getByText('やることは全部終わりました！').isVisible().catch(() => false);
    expect(hasCards || hasEmptyState).toBeTruthy();
  });

  test('タスクを新規作成できる（クイック登録）', async ({ page }) => {
    await page.goto('/tasks/new');
    await expect(page.getByText('クイック登録')).toBeVisible({ timeout: 8000 });
    const taskTitle = `E2Eテスト_${Date.now()}`;
    await page.getByPlaceholder('例：皿洗い').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL((url) => url.pathname === '/', { timeout: 10000 });
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 8000 });
  });

  test('タスクテンプレートページが表示される', async ({ page }) => {
    await page.goto('/tasks/new');
    await expect(page.getByText('テンプレートから選ぶ')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('キッチン')).toBeVisible();
  });

  test('タスクテンプレートから登録できる', async ({ page }) => {
    await page.goto('/tasks/new');
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: '皿洗い' }).first().click();
    await expect(page).toHaveURL((url) => url.pathname === '/', { timeout: 10000 });
  });

  test('タスク名未入力でバリデーションエラー', async ({ page }) => {
    await page.goto('/tasks/new');
    await page.waitForSelector('form');
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText('タスク名を入力してください')).toBeVisible({ timeout: 5000 });
  });

  test('タスクを完了にすると「今日終わったこと」タブに移動する', async ({ page }) => {
    // タスクを作成
    await page.goto('/tasks/new');
    const taskTitle = `完了テスト_${Date.now()}`;
    await page.getByPlaceholder('例：皿洗い').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL((url) => url.pathname === '/');
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 8000 });

    // 完了ボタンをクリック
    const taskCard = page.locator('.bg-white\\/80').filter({ hasText: taskTitle });
    await taskCard.locator('button').first().click();

    // 「今日終わったこと」タブに切り替えて確認
    await page.waitForTimeout(1500);
    await page.locator('button', { hasText: '今日終わったこと' }).click();
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 8000 });
  });
});
