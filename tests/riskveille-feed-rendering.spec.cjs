const { test, expect } = require('@playwright/test');

const baseURL = process.env.RISKVEILLE_TEST_URL || 'http://127.0.0.1:8790/';
const password = process.env.RISKVEILLE_PASSWORD || 'Carrefour2026';

test('les articles des sources centrales sont affiches', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  const feedResponsePromise = page.waitForResponse(
    response => response.url().endsWith('/api/feeds') && response.request().method() === 'GET',
    { timeout: 30000 },
  );

  await page.goto(baseURL);
  await page.locator('#loginName').fill('Test affichage');
  await page.locator('#loginPwd').fill(password);
  await page.locator('#loginBtn').click();
  await expect(page.locator('#loginOverlay')).toBeHidden({ timeout: 20000 });

  const feedResponse = await feedResponsePromise;
  expect(feedResponse.ok()).toBeTruthy();
  const snapshot = await feedResponse.json();
  const globalSources = snapshot.sources.filter(source => !source.id.startsWith('competitor-'));
  expect(globalSources.length).toBe(66);
  expect(globalSources.some(source => Array.isArray(source.items) && source.items.length > 0)).toBeTruthy();

  await expect.poll(async () => page.locator('#feed .card').count(), { timeout: 45000 }).toBeGreaterThan(0);
  expect(pageErrors).toEqual([]);
});
