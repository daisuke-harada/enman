import { test, expect } from '@playwright/test';

test.describe('家族グループセットアップ', () => {
  test('家族セットアップページが表示される（新規登録後）', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: '新規登録' }).first().click();
    await page.waitForSelector('#reg-name');

    const email = `setup_test_${Date.now()}@example.com`;
    await page.locator('#reg-name').fill('セットアップテスト');
    await page.locator('#reg-role').fill('その他');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('testpass123');
    await page.locator('form button[type="submit"]').click();

    await expect(page).toHaveURL(/\/family\/setup/, { timeout: 15000 });
    await expect(page.getByText('家族グループの設定')).toBeVisible();
    await expect(page.locator('button', { hasText: '新しく作る' })).toBeVisible();
    await expect(page.locator('button', { hasText: '参加する' })).toBeVisible();
  });

  test('参加タブへの切り替えと招待コード入力欄表示', async ({ page }) => {
    // 新規ユーザーで登録してセットアップページへ
    await page.goto('/login');
    await page.locator('button', { hasText: '新規登録' }).first().click();
    await page.waitForSelector('#reg-name');
    const email = `join_test_${Date.now()}@example.com`;
    await page.locator('#reg-name').fill('参加テスト');
    await page.locator('#reg-role').fill('その他');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('testpass123');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/family\/setup/, { timeout: 15000 });

    await page.locator('button', { hasText: '参加する' }).first().click();
    await expect(page.locator('#invite-code')).toBeVisible({ timeout: 5000 });
  });

  test('無効な招待コードでエラーが表示される', async ({ page }) => {
    // 新規ユーザーで登録してセットアップページへ
    await page.goto('/login');
    await page.locator('button', { hasText: '新規登録' }).first().click();
    await page.waitForSelector('#reg-name');
    const email = `invalid_code_test_${Date.now()}@example.com`;
    await page.locator('#reg-name').fill('コードテスト');
    await page.locator('#reg-role').fill('その他');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('testpass123');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/family\/setup/, { timeout: 15000 });

    await page.locator('button', { hasText: '参加する' }).first().click();
    await page.waitForSelector('#invite-code');
    await page.locator('#invite-code').fill('INVALIDCODE1');
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText('招待コードが正しくありません')).toBeVisible({ timeout: 10000 });
  });

  test('有効な招待コードで家族グループに参加できる', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: '新規登録' }).first().click();
    await page.waitForSelector('#reg-name');
    const email = `valid_code_test_${Date.now()}@example.com`;
    await page.locator('#reg-name').fill('参加テスト2');
    await page.locator('#reg-role').fill('その他');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('testpass123');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/family\/setup/, { timeout: 15000 });

    await page.locator('button', { hasText: '参加する' }).first().click();
    await page.waitForSelector('#invite-code');
    // シードデータの招待コード: TANAKA000001
    await page.locator('#invite-code').fill('TANAKA000001');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL((url) => url.pathname === '/', { timeout: 10000 });
  });
});
