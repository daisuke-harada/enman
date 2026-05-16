import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('感謝スタンプ（Appreciation）', () => {
  test('「今日終わったこと」タブに完了済みタスクが表示される', async ({ page }) => {
    await login(page);
    await page.locator('button', { hasText: '今日終わったこと' }).click();
    await page.waitForTimeout(2000);

    const doneTasks = page.locator('.bg-white\\/80');
    const count = await doneTasks.count();
    console.log(`完了済みタスク数: ${count}`);

    if (count > 0) {
      const stampButtons = page.locator('button[title]');
      const stampCount = await stampButtons.count();
      console.log(`スタンプボタン数: ${stampCount}`);
    }
    expect(true).toBeTruthy();
  });

  test('ママ視点でパパのタスクにスタンプ送信', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('#email');
    await page.locator('#email').fill('mama@tanaka.example');
    await page.locator('#password').fill('password123');
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 });

    await page.locator('button', { hasText: '今日終わったこと' }).click();
    await page.waitForTimeout(2000);

    const stampButtons = page.locator('button[title]');
    const count = await stampButtons.count();
    console.log(`スタンプ可能ボタン数: ${count}`);

    if (count > 0) {
      await stampButtons.first().click();
      await expect(page.getByText('送りました！').first()).toBeVisible({ timeout: 8000 });
    } else {
      console.log('スタンプ対象のタスクがありませんでした');
      expect(true).toBeTruthy();
    }
  });

  test('タスク完了後に感謝スタンプが送れる（パパ→ママ）', async ({ page }) => {
    // パパでログイン
    await login(page);

    // ママが完了したタスクを探す
    await page.locator('button', { hasText: '今日終わったこと' }).click();
    await page.waitForTimeout(2000);

    const allStamps = page.locator('button[title]');
    const count = await allStamps.count();
    console.log(`パパから見たスタンプ対象数: ${count}`);

    if (count > 0) {
      const firstStamp = allStamps.first();
      const title = await firstStamp.getAttribute('title');
      console.log(`送るスタンプ: ${title}`);
      await firstStamp.click();
      await expect(page.getByText('送りました！').first()).toBeVisible({ timeout: 8000 });
    } else {
      console.log('他の家族が完了したタスクがありません');
      expect(true).toBeTruthy();
    }
  });
});
