import { test, expect } from '@playwright/test';
import { login } from './helpers';

// タスク行セレクタ: デスクトップの rounded-2xl div（モバイルは rounded-[22px]、カレンダーセルは button）
const taskRowLocator = (page: import('@playwright/test').Page, taskTitle: string) =>
  page.locator('div[class*="rounded-2xl"]').filter({ hasText: taskTitle }).first();

// 編集モーダルを開き、「削除」ボタンをクリックする
async function clickDeleteInModal(
  page: import('@playwright/test').Page,
  taskRow: import('@playwright/test').Locator
) {
  await taskRow.locator('button').nth(1).click();
  // BottomSheet（タスクを編集）が表示されるまで待機
  await page.locator('h3', { hasText: 'タスクを編集' }).waitFor({ timeout: 5000 });
  // タスク行の削除アイコン（title="削除"）と区別するため、テキスト内容が "削除" のボタンに絞る
  const deleteBtn = page.locator('button').filter({ hasText: /^削除$/ });
  // BottomSheet のスプリングアニメーション完了までビューポート内に入るのを待つ
  await expect(deleteBtn).toBeInViewport({ timeout: 5000 });
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
    const hasTasks = await page.locator('div[class*="rounded-2xl"]').count() > 0;
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

    // 削除ボタンクリック済み → 通常タスクは確認なしで即削除 → タスク行が消える
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
    await expect(taskRow.getByText(/さんが完了/)).toBeVisible({ timeout: 8000 });

    // 編集モーダルを開く（アニメーション完了待ち）
    await clickDeleteInModal(page, taskRow);

    // 削除ボタンクリック済み → 繰り返し用スコープ選択が表示される
    await expect(page.getByText('この1件のみ削除')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('すべて削除').first()).toBeVisible();
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
    await expect(taskRow.getByText(/さんが完了/)).toBeVisible({ timeout: 8000 });

    // 編集モーダルを開く → 削除クリック → スコープ選択 → 「この1件のみ削除」
    await clickDeleteInModal(page, taskRow);
    await expect(page.getByText('この1件のみ削除')).toBeVisible({ timeout: 3000 });
    await page.locator('button', { hasText: 'この1件のみ削除' }).click();

    // モーダルが閉じ、完了表示が消える
    await expect(page.getByText('削除する範囲を選択')).not.toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(1500);
    await expect(
      page.locator('div[class*="rounded-2xl"]').filter({ hasText: taskTitle }).getByText(/さんが完了/)
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
    await expect(taskRow.getByText(/さんが完了/)).toBeVisible({ timeout: 8000 });

    // 編集モーダルを開く → 削除クリック → スコープ選択 → 「すべて削除」 → 確認ダイアログ → 「削除する」
    await clickDeleteInModal(page, taskRow);
    await expect(page.getByText('すべて削除').first()).toBeVisible({ timeout: 3000 });
    await page.locator('button', { hasText: 'すべて削除' }).click();
    await expect(page.getByText('繰り返しをすべて削除しますか？')).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: '削除する' }).click();

    // モーダルが閉じる（ルール削除成功）
    await expect(page.getByText('繰り返しをすべて削除しますか？')).not.toBeVisible({ timeout: 8000 });
    // ルール削除後: recurrence_rule_id が NULL になるため 🔁 アイコンが消える
    await page.waitForTimeout(2000);
    await expect(
      page.locator('div[class*="rounded-2xl"]').filter({ hasText: taskTitle }).locator('span', { hasText: '🔁' })
    ).not.toBeVisible({ timeout: 5000 });
  });

  // ── 完了テスト ─────────────────────────────────────────────────────────────

  test('単発タスクを完了できる', async ({ page }) => {
    await page.goto('/tasks/new');
    const taskTitle = `完了テスト_${Date.now()}`;
    await page.getByPlaceholder('例：皿洗い').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL((url) => url.pathname === '/', { timeout: 10000 });

    const taskRow = taskRowLocator(page, taskTitle);
    await expect(taskRow).toBeVisible({ timeout: 8000 });
    await taskRow.locator('button').first().click();
    await page.waitForTimeout(1500);
    await expect(taskRow.getByText(/さんが完了/)).toBeVisible({ timeout: 8000 });
  });

  test('繰り返し仮想タスクを完了できる（実体化フロー）', async ({ page }) => {
    const taskTitle = `仮想完了_${Date.now()}`;
    await page.getByPlaceholder('例：皿洗い、買い物...').fill(taskTitle);
    await page.locator('select').selectOption('daily');
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(2000);

    const taskRow = taskRowLocator(page, taskTitle);
    await expect(taskRow).toBeVisible({ timeout: 8000 });
    await taskRow.locator('button').first().click();
    await page.waitForTimeout(1500);
    await expect(taskRow.getByText(/さんが完了/)).toBeVisible({ timeout: 8000 });
  });

  // ── 編集テスト ─────────────────────────────────────────────────────────────

  test('タスクのタイトルを編集して保存できる', async ({ page }) => {
    await page.goto('/tasks/new');
    const originalTitle = `編集前_${Date.now()}`;
    await page.getByPlaceholder('例：皿洗い').fill(originalTitle);
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL((url) => url.pathname === '/', { timeout: 10000 });

    const taskRow = taskRowLocator(page, originalTitle);
    await expect(taskRow).toBeVisible({ timeout: 8000 });

    // 編集ボタン（nth(1)）をクリックして BottomSheet を開く
    await taskRow.locator('button').nth(1).click();
    await page.locator('h3', { hasText: 'タスクを編集' }).waitFor({ timeout: 5000 });

    // z-50 のオーバーレイ（BottomSheet）内のテキスト入力が編集タイトル欄
    const newTitle = `編集後_${Date.now()}`;
    await page.locator('[class*="z-50"]').locator('input[type="text"]').fill(newTitle);
    await page.getByRole('button', { name: '保存する' }).click();

    await expect(taskRowLocator(page, newTitle)).toBeVisible({ timeout: 8000 });
    await expect(page.locator('div[class*="rounded-2xl"]').filter({ hasText: originalTitle })).toHaveCount(0, { timeout: 5000 });
  });

  // ── 繰り返しタスク作成テスト ───────────────────────────────────────────────

  test('繰り返しタスクを毎週（曜日指定）で作成できる', async ({ page }) => {
    const taskTitle = `毎週テスト_${Date.now()}`;
    const weekdayLabels = ['日', '月', '火', '水', '木', '金', '土'];
    const todayLabel = weekdayLabels[new Date().getDay()];

    await page.getByPlaceholder('例：皿洗い、買い物...').fill(taskTitle);
    await page.locator('select').selectOption('weekly');

    // 「曜日」ラベルの親 div 内にある今日の曜日ボタンをクリック
    const weekdaySection = page.locator('label', { hasText: '曜日' }).locator('..');
    await weekdaySection.getByRole('button', { name: todayLabel, exact: true }).click();
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(2000);

    await expect(taskRowLocator(page, taskTitle)).toBeVisible({ timeout: 8000 });
  });

  test('繰り返しタスクを毎月（日付指定）で作成できる', async ({ page }) => {
    const taskTitle = `毎月日付テスト_${Date.now()}`;
    const todayDate = new Date().getDate().toString();

    await page.getByPlaceholder('例：皿洗い、買い物...').fill(taskTitle);
    await page.locator('select').selectOption('monthly');

    // デフォルトが「毎月○日」モードなので input[type="number"] が表示されている
    await page.locator('input[type="number"]').fill(todayDate);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(2000);

    await expect(taskRowLocator(page, taskTitle)).toBeVisible({ timeout: 8000 });
  });

  test('繰り返しタスクを毎月（第△曜日指定）で作成できる', async ({ page }) => {
    const taskTitle = `毎月曜日テスト_${Date.now()}`;
    const today = new Date();
    const weekOfMonth = Math.ceil(today.getDate() / 7);
    const weekdayLabels = ['日', '月', '火', '水', '木', '金', '土'];
    const nthLabels = ['第1', '第2', '第3', '第4', '第5'];

    await page.getByPlaceholder('例：皿洗い、買い物...').fill(taskTitle);
    await page.locator('select').selectOption('monthly');

    // 「第△曜日」モードに切り替え
    await page.getByRole('button', { name: '第△曜日', exact: true }).click();
    // 第N週ボタンをクリック
    await page.getByRole('button', { name: nthLabels[weekOfMonth - 1], exact: true }).click();
    // 曜日ボタンをクリック
    await page.getByRole('button', { name: weekdayLabels[today.getDay()], exact: true }).click();
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(2000);

    await expect(taskRowLocator(page, taskTitle)).toBeVisible({ timeout: 8000 });
  });

  // ── デスクトップホバー削除テスト ──────────────────────────────────────────

  test('デスクトップのホバーボタンで単発タスクを削除できる', async ({ page }) => {
    await page.goto('/tasks/new');
    const taskTitle = `ホバー削除テスト_${Date.now()}`;
    await page.getByPlaceholder('例：皿洗い').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL((url) => url.pathname === '/', { timeout: 10000 });

    const taskRow = taskRowLocator(page, taskTitle);
    await expect(taskRow).toBeVisible({ timeout: 8000 });
    await taskRow.hover();
    await taskRow.locator('button[title="削除"]').click({ force: true });

    // 単発タスクは確認なしで即削除
    await expect(page.locator('div[class*="rounded-2xl"]').filter({ hasText: taskTitle })).toHaveCount(0, { timeout: 8000 });
  });

  test('デスクトップのホバーボタンで繰り返しタスクを1件削除できる', async ({ page }) => {
    const taskTitle = `ホバー1件削除_${Date.now()}`;
    await page.getByPlaceholder('例：皿洗い、買い物...').fill(taskTitle);
    await page.locator('select').selectOption('daily');
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(2000);

    const taskRow = taskRowLocator(page, taskTitle);
    await expect(taskRow).toBeVisible({ timeout: 8000 });
    await taskRow.hover();
    await taskRow.locator('button[title="削除"]').click({ force: true });

    // インライン確認ボタンが表示される
    await expect(page.getByRole('button', { name: 'この1件のみ' })).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: 'この1件のみ' }).click();

    // 仮想タスクを実体化 → cancelled → カレンダーから消える
    await expect(page.locator('div[class*="rounded-2xl"]').filter({ hasText: taskTitle })).toHaveCount(0, { timeout: 8000 });
  });

  test('デスクトップのホバーボタンで繰り返しルールをすべて削除できる', async ({ page }) => {
    const taskTitle = `ホバー全削除_${Date.now()}`;
    await page.getByPlaceholder('例：皿洗い、買い物...').fill(taskTitle);
    await page.locator('select').selectOption('daily');
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(2000);

    const taskRow = taskRowLocator(page, taskTitle);
    await expect(taskRow).toBeVisible({ timeout: 8000 });
    await taskRow.hover();
    await taskRow.locator('button[title="削除"]').click({ force: true });

    // インライン「すべて削除」は確認ダイアログなしで即ルール削除
    await expect(page.getByRole('button', { name: 'すべて削除' })).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: 'すべて削除' }).click();

    await expect(page.locator('div[class*="rounded-2xl"]').filter({ hasText: taskTitle })).toHaveCount(0, { timeout: 8000 });
  });
});
