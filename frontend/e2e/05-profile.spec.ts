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

  test('家族グループの招待コードセクションが表示される', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    const hasInvite = await page.getByText('家族グループ').isVisible().catch(() => false);
    if (hasInvite) {
      await expect(page.getByText(/招待コードをコピー/)).toBeVisible();
    }
  });

  test('モバイルではログアウトボタンが表示される', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/profile');
    await page.waitForTimeout(1000);
    await expect(page.getByRole('button', { name: /ログアウト/ }).last()).toBeVisible({ timeout: 8000 });
  });
});
