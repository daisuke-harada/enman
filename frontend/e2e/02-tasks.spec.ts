import { test, expect } from '@playwright/test';
import { login } from './helpers';

// タスク行セレクタ: デスクトップの rounded-2xl div（モバイルは rounded-[22px]、カレンダーセルは button）
const taskRowLocator = (page: import('@playwright/test').Page, taskTitle: string) =>
  page.locator('div[class*="rounded-2xl"]').filter({ hasText: taskTitle }).first();

// 編集モーダルを開き、BottomSheet アニメーション完了を待って「削除」ボタンをクリックする
// nextjs-portal (dev overlay) が pointer-events を奪うため force: true が必要
async function clickDeleteInModal(
  page: import('@playwright/test').Page,
  taskRow: import('@playwright/test').Locator
) {
  await taskRow.locator('button').nth(1).click();
  const deleteBtn = page.getByRole('button', { name: '削除', exact: true });
  // BottomSheet の Spring アニメーション完了まで待機（ビューポート内に入るまで）
  await expect(deleteBtn).toBeInViewport({ timeout: 5000 });
  // dev overlay (nextjs-portal) が pointer-events を奪うため force: true で強制クリック
  await deleteBtn.click({ force: true });
}

test.describe('タスク管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('ホームページにカレンダービューが表示される', async ({ page }) => {
    // デスクトップ(1280px): 月間カレンダーの年月ヘッダーと「今日」ボタンが表示される
    await expect(page.getByRole('button', { name: '今日' }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('heading').filter({ hasText: /\d+年 \d+月/ }).first()).toBeVisible({ timeout: 8000 });
  });

  test('当日の詳細パネルとタスク追加フォームが表示される', async ({ page }) => {
    // デスクトップ: DesktopInlineTaskForm の h3 とプレースホルダーが表示される
    await expect(page.locator('h3').filter({ hasText: 'タスクを追加' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByPlaceholder('例：皿洗い、買い物...').first()).toBeVisible({ timeout: 8000 });
  });

  test('当日のタスクセクションまたは空状態が表示される', async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasTasks = await page.locator('div[class*="rounded-2xl"]').filter({ hasText: /DONE|予定/ }).count() > 0;
    // count() はCSS非表示の要素も含むため、モバイル+デスクトップ両方から判定できる
    const hasEmptyState = await page.getByText('この日のタスクはありません').count() > 0;
    expect(hasTasks || hasEmptyState).toBeTruthy();
  });

  test('タスクを新規作成できる', async ({ page }) => {
    await page.goto('/tasks/new');
    await expect(page.getByPlaceholder('例：皿洗い')).toBeVisible({ timeout: 8000 });
    const taskTitle = `E2Eテスト_${Date.now()}`;
    await page.getByPlaceholder('例：皿洗い').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL((url) => url.pathname === '/', { timeout: 10000 });
    // デスクトップタスク行にタイトルが表示される
    await expect(taskRowLocator(page, taskTitle)).toBeVisible({ timeout: 8000 });
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

  test('タスクを完了にするとDONEバッジが表示される', async ({ page }) => {
    // タスクを作成
    await page.goto('/tasks/new');
    const taskTitle = `完了テスト_${Date.now()}`;
    await page.getByPlaceholder('例：皿洗い').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL((url) => url.pathname === '/');
    const taskRow = taskRowLocator(page, taskTitle);
    await expect(taskRow).toBeVisible({ timeout: 8000 });

    // タスク行の最初のボタン（完了ボタン）をクリック
    await taskRow.locator('button').first().click();

    // DONEバッジが表示されることを確認
    await page.waitForTimeout(1500);
    await expect(taskRow.getByText('DONE')).toBeVisible({ timeout: 8000 });
  });

  // ── 削除テスト ──────────────────────────────────────────────────────────

  test('通常タスクを削除できる（繰り返しなし）', async ({ page }) => {
    // タスクを作成
    await page.goto('/tasks/new');
    const taskTitle = `削除テスト_${Date.now()}`;
    await page.getByPlaceholder('例：皿洗い').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL((url) => url.pathname === '/', { timeout: 10000 });
    const taskRow = taskRowLocator(page, taskTitle);
    await expect(taskRow).toBeVisible({ timeout: 8000 });

    // 編集モーダルを開く（アニメーション完了待ち）
    await clickDeleteInModal(page, taskRow);

    // 削除ボタンクリック済み → 繰り返し選択肢はなく「削除しますか？」が出る
    await expect(page.getByText('削除しますか？')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('このタスクのみ削除')).not.toBeVisible();
    await expect(page.getByText('繰り返しをすべて削除')).not.toBeVisible();

    // 削除を実行 → タスク行が消える
    await page.getByRole('button', { name: '削除する' }).click();
    await expect(page.locator('div[class*="rounded-2xl"]').filter({ hasText: taskTitle })).toHaveCount(0, { timeout: 8000 });
  });

  test('繰り返しタスクの削除でスコープ選択が表示される', async ({ page }) => {
    const taskTitle = `繰り返し削除UI_${Date.now()}`;

    // デスクトップのインラインフォームで毎日繰り返しタスクを作成
    await page.getByPlaceholder('例：皿洗い、買い物...').fill(taskTitle);
    await page.locator('select').selectOption('daily');
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // 今日の仮想タスクを完了させて task_id を発行させる
    const taskRow = taskRowLocator(page, taskTitle);
    await expect(taskRow).toBeVisible({ timeout: 8000 });
    await taskRow.locator('button').first().click();
    await expect(taskRow.getByText('DONE')).toBeVisible({ timeout: 8000 });

    // 編集モーダルを開く（アニメーション完了待ち）
    await clickDeleteInModal(page, taskRow);

    // 削除ボタンクリック済み → 繰り返し用スコープ選択が表示される
    await expect(page.getByText('このタスクのみ削除')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('繰り返しをすべて削除')).toBeVisible();
    // 通常の「削除する」ボタン（simpleモード）は出ない
    await expect(page.getByRole('button', { name: '削除する', exact: true })).not.toBeVisible();
  });

  test('繰り返しタスクを「このタスクのみ削除」できる', async ({ page }) => {
    const taskTitle = `単体削除_${Date.now()}`;

    // 毎日繰り返しタスクを作成
    await page.getByPlaceholder('例：皿洗い、買い物...').fill(taskTitle);
    await page.locator('select').selectOption('daily');
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // 今日の仮想タスクを完了させる
    const taskRow = taskRowLocator(page, taskTitle);
    await expect(taskRow).toBeVisible({ timeout: 8000 });
    await taskRow.locator('button').first().click();
    await expect(taskRow.getByText('DONE')).toBeVisible({ timeout: 8000 });

    // 編集モーダルを開く → 削除クリック → スコープ選択 → 「このタスクのみ削除」
    await clickDeleteInModal(page, taskRow);
    await expect(page.getByText('このタスクのみ削除')).toBeVisible({ timeout: 3000 });
    await page.locator('button', { hasText: 'このタスクのみ削除' }).click();

    // モーダルが閉じ、DONEバッジが消える
    // （繰り返しルールは残るので仮想PENDINGが再出現する場合があるが DONE は消える）
    await expect(page.getByText('削除する範囲を選択')).not.toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(1500);
    await expect(
      page.locator('div[class*="rounded-2xl"]').filter({ hasText: taskTitle }).getByText('DONE')
    ).not.toBeVisible({ timeout: 5000 });
  });

  test('繰り返しタスクを「繰り返しをすべて削除」できる', async ({ page }) => {
    const taskTitle = `全削除_${Date.now()}`;

    // 毎日繰り返しタスクを作成
    await page.getByPlaceholder('例：皿洗い、買い物...').fill(taskTitle);
    await page.locator('select').selectOption('daily');
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // 今日の仮想タスクを完了させる
    const taskRow = taskRowLocator(page, taskTitle);
    await expect(taskRow).toBeVisible({ timeout: 8000 });
    await taskRow.locator('button').first().click();
    await expect(taskRow.getByText('DONE')).toBeVisible({ timeout: 8000 });

    // 編集モーダルを開く → 削除クリック → スコープ選択 → 「繰り返しをすべて削除」
    await clickDeleteInModal(page, taskRow);
    await expect(page.getByText('繰り返しをすべて削除')).toBeVisible({ timeout: 3000 });
    await page.locator('button', { hasText: '繰り返しをすべて削除' }).click();

    // モーダルが閉じる（ルール削除成功）
    await expect(page.getByText('繰り返しをすべて削除')).not.toBeVisible({ timeout: 8000 });
    // ルール削除後: recurrence_rule_id が NULL になるため 🔁 アイコンが消える
    await page.waitForTimeout(2000);
    await expect(
      page.locator('div[class*="rounded-2xl"]').filter({ hasText: taskTitle }).locator('span', { hasText: '🔁' })
    ).not.toBeVisible({ timeout: 5000 });
  });
});
