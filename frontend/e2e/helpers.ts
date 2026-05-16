import { Page } from '@playwright/test';

export const TEST_USER = {
  email: 'papa@tanaka.example',
  password: 'password123',
  name: 'タカシ',
  role: 'パパ',
};

export async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/login');
  await page.waitForSelector('#email', { timeout: 10000 });
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 });
}

export async function logout(page: Page) {
  const logoutBtn = page.getByRole('button', { name: /ログアウト/ }).first();
  await logoutBtn.click();
  await page.waitForURL(/\/login/, { timeout: 8000 });
}
