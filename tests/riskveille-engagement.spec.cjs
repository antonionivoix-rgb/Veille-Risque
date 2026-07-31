const { test, expect } = require('@playwright/test');

const baseURL = process.env.RISKVEILLE_TEST_URL || 'http://127.0.0.1:8790/';
const password = process.env.RISKVEILLE_PASSWORD || 'Carrefour2026';

async function login(page, name) {
  await page.goto(baseURL);
  if (await page.locator('#loginOverlay:not(.hidden)').isVisible()) {
    await page.locator('#loginName').fill(name);
    await page.locator('#loginPwd').fill(password);
    await page.locator('#loginBtn').click();
  }
  await expect(page.locator('#loginOverlay')).toBeHidden({ timeout: 20000 });
  await expect(page.locator('#viewRisks')).toHaveClass(/active/);
  await expect(page.locator('#nc-MON')).not.toHaveText('—', { timeout: 20000 });
}

test('archives, recommandations, commentaires et votes persistent', async ({ page }) => {
  const title = `Article archive test ${Date.now()}`;
  await login(page, 'Test engagement');

  await expect(page.locator('#sidebarGlobal')).toHaveCount(0);
  await expect(page.locator('.nav-priority')).toHaveCount(0);
  await expect(page.locator('#tabRisks')).toHaveText('Vue globale');
  await expect(page.locator('.nav-geo').first()).toHaveAttribute('data-geo', 'MONDE');
  await expect(page.locator('.nav-geo[data-geo="MONDE"]')).toHaveAttribute('aria-checked', 'true');

  await page.locator('#btnAddArticle').click();
  await expect(page.locator('#addArtDesc')).toHaveCount(0);
  await page.locator('#addArtUrl').fill(`https://example.com/riskveille/${Date.now()}`);
  await page.locator('#addArtTitle').fill(title);
  await page.locator('#addArtComment').fill('Commentaire créé avec l’article.');
  await page.locator('#addArtRecommendation').selectOption('recommended');
  await page.locator('#addArtArchived').check();
  await page.locator('#addArtSubmit').click();
  await expect(page.locator('#addArticleOv')).not.toHaveClass(/open/);

  await page.locator('.nav-article[data-scope="archived"]').click();
  await expect(page.locator('.card', { hasText: title })).toBeVisible({ timeout: 20000 });
  await page.locator('.card', { hasText: title }).click();
  await expect(page.locator('#dpArchived')).toBeChecked();
  await expect(page.locator('#dpRecommendation')).toHaveValue('recommended');
  await expect(page.locator('#dpSharedComments')).toContainText('Commentaire créé avec l’article.');

  await page.locator('#dpVote').click();
  await expect(page.locator('#dpVoteCount')).toHaveText('1');
  await page.reload();
  await expect(page.locator('#viewRisks')).toHaveClass(/active/);
  await page.locator('.nav-article[data-scope="archived"]').click();
  const archivedCard = page.locator('.card', { hasText: title });
  await expect(archivedCard).toBeVisible({ timeout: 20000 });
  await expect(archivedCard.locator('.rv-upvote')).toHaveCount(1);
  await expect(archivedCard.locator('.card-vote strong')).toHaveText('1');
  await page.screenshot({ path: 'test-results/engagement-desktop.png', fullPage: true });
});

test('les filtres restent lisibles sur mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'Test mobile');
  await page.locator('#btnFilters').click();
  await expect(page.locator('#sidebar-risks')).toHaveClass(/mobile-open/);
  await expect(page.locator('.nav-geo[data-geo="MONDE"]')).toBeVisible();
  await expect(page.locator('.nav-article[data-scope="archived"]')).toBeVisible();
  await page.waitForTimeout(350);
  await page.screenshot({ path: 'test-results/engagement-mobile.png', fullPage: true });
});
