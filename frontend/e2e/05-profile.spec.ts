import { test, expect } from '@playwright/test';
import { TEST_USER, login } from './helpers';

test.describe('プロフィール', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('プロフィールページにアクセスできる', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'マイページ' })).toBeVisible({ timeout: 8000 });
  });

  test('ユーザー情報が表示される', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByText(TEST_USER.name).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(TEST_USER.role).first()).toBeVisible();
  });

  test('円満ポイントが表示される', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByText('円満ポイント')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/\d+ ?pt/).first()).toBeVisible();
  });

  test('プロフィール編集フォームが表示される', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByText('プロフィール編集')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#profile-name')).toBeVisible();
    await expect(page.locator('#profile-role')).toBeVisible();
    await expect(page.getByRole('button', { name: '保存する' })).toBeVisible();
  });

  test('プロフィールを保存できる', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForSelector('#profile-name', { timeout: 8000 });
    const nameInput = page.locator('#profile-name');
    await nameInput.clear();
    await nameInput.fill(TEST_USER.name);
    await page.getByRole('button', { name: '保存する' }).click();
    await expect(page.getByText('✓ 保存しました')).toBeVisible({ timeout: 8000 });
  });

  test('家族グループセクションと招待コードボタンが表示される', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByText('家族グループ')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /招待コードをコピー/ })).toBeVisible();
  });

  test('招待コードをコピーボタンをクリックするとコピー済みフィードバックが表示される', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('button', { name: /招待コードをコピー/ })).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: /招待コードをコピー/ }).click();
    await expect(page.getByRole('button', { name: /コピーしました/ })).toBeVisible({ timeout: 3000 });
  });

  test('コピーフィードバックは2秒後に元のテキストに戻る', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('button', { name: /招待コードをコピー/ })).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: /招待コードをコピー/ }).click();
    await expect(page.getByRole('button', { name: /コピーしました/ })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: /招待コードをコピー/ })).toBeVisible({ timeout: 5000 });
  });

  test('クリップボードに招待コードがコピーされる', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/profile');
    await expect(page.getByRole('button', { name: /招待コードをコピー/ })).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: /招待コードをコピー/ }).click();
    await expect(page.getByRole('button', { name: /コピーしました/ })).toBeVisible({ timeout: 3000 });
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('TANAKA000001');
  });

  test('モバイルではログアウトボタンが表示される', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/profile');
    await page.waitForTimeout(1000);
    await expect(page.getByRole('button', { name: /ログアウト/ }).last()).toBeVisible({ timeout: 8000 });
  });
});
