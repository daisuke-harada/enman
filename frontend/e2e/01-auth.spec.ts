import { test, expect } from '@playwright/test';
import { TEST_USER, login, logout } from './helpers';

test.describe('認証機能', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('enman').first()).toBeVisible();
    await expect(page.getByText('家族の感謝を可視化するアプリ').first()).toBeVisible();
    await expect(page.locator('button', { hasText: 'ログイン' }).first()).toBeVisible();
    await expect(page.locator('button', { hasText: '新規登録' }).first()).toBeVisible();
  });

  test('無効な認証情報でログイン失敗', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('#email');
    await page.locator('#email').fill('wrong@example.com');
    await page.locator('#password').fill('wrongpassword');
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible({ timeout: 10000 });
  });

  test('有効な認証情報でログイン成功', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL((url) => url.pathname === '/');
    await expect(page.getByText('これからやること')).toBeVisible({ timeout: 10000 });
  });

  test('新規登録タブに切り替わる', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: '新規登録' }).first().click();
    await expect(page.locator('#reg-name')).toBeVisible();
    await expect(page.locator('#reg-role')).toBeVisible();
  });

  test('新規ユーザー登録', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: '新規登録' }).first().click();
    await page.waitForSelector('#reg-name');
    const email = `e2e_reg_${Date.now()}@example.com`;
    await page.locator('#reg-name').fill('テストユーザー');
    await page.locator('#reg-role').selectOption('その他');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('testpass123');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/family\/setup|\//, { timeout: 15000 });
  });

  test('ログアウトできる', async ({ page }) => {
    await login(page);
    await logout(page);
    await expect(page).toHaveURL(/\/login/);
  });

  test('未ログイン状態でトップにアクセスするとログイン画面にリダイレクト', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
