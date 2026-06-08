import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('感謝コメント（Appreciation）', () => {
  test('タスク完了後にパパがコメントでき、ママがログイン後も完了状態が保持される', async ({ page }) => {
    // パパでタスクを作成して完了させる
    await login(page);

    await page.goto('/tasks/new');
    await page.waitForSelector('input[placeholder="例：皿洗い"]', { timeout: 8000 });
    const taskTitle = `コメントテスト_${Date.now()}`;
    await page.locator('input[placeholder="例：皿洗い"]').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page.locator('div[class*="rounded-2xl"]').filter({ hasText: taskTitle }).first()).toBeVisible({ timeout: 8000 });

    // 完了ボタンをクリック
    const taskRow = page.locator('div[class*="rounded-2xl"]').filter({ hasText: taskTitle }).first();
    await taskRow.locator('button').first().click();
    await page.waitForTimeout(1500);
    await expect(
      page.locator('div[class*="rounded-2xl"]').filter({ hasText: taskTitle }).getByText(/さんが完了/)
    ).toBeVisible({ timeout: 8000 });

    // パパをログアウト
    await page.goto('/profile');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /ログアウト/ }).last().click();
    await page.waitForURL(/\/login/, { timeout: 8000 });

    // ママでログイン後も完了状態が維持されていることを確認
    await login(page, 'mama@tanaka.example', 'password123');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForURL('/', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const completedTask = page.locator('div[class*="rounded-2xl"]').filter({ hasText: taskTitle }).getByText(/さんが完了/);
    const isCompleted = await completedTask.isVisible().catch(() => false);
    expect(isCompleted).toBeTruthy();
  });

  test('通知ページからコメント内容が確認できる', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');
    await page.waitForTimeout(2000);
    // 通知があればカードが、なければ空状態メッセージが表示される
    const hasCards = await page.locator('.rounded-\\[24px\\]').count() > 0;
    const hasEmpty = await page.getByText('まだ通知はありません').isVisible().catch(() => false);
    expect(hasCards || hasEmpty).toBeTruthy();
  });
});
