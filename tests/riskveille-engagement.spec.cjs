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

test('le bouton Carrefour restaure la vue initiale', async ({ page }) => {
  await login(page, 'Test accueil');
  const home = page.locator('#btnHome');

  await expect(home).toContainText('Veille Risque');
  await expect(home.locator('.h-logo-primary')).toHaveAttribute('src', 'assets/carrefour-logo.svg');

  await page.locator('.nav-geo[data-geo="MONDE"]').click();
  await page.locator('.nav-geo[data-geo="FR"]').click();
  await page.locator('.nav-article[data-scope="archived"]').click();
  await page.locator('[data-sort="recent"]').click();
  await page.locator('#searchInput').fill('test filtre');
  await page.locator('#tabConcurrence').click();
  await home.click();

  await expect(page.locator('#viewRisks')).toHaveClass(/active/);
  await expect(page.locator('.nav-geo[data-geo="MONDE"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.nav-geo[data-geo="FR"]')).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('.nav-article[data-scope="archived"]')).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('.nav-cat[data-code="all"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-sort="votes"]')).toHaveClass(/active/);
  await expect(page.locator('#searchInput')).toHaveValue('');
  await page.waitForTimeout(350);
  await expect(page.locator('#searchInput')).toHaveValue('');
  await expect(page.locator('#filterState')).not.toContainText('France');
});

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
  const newlyArchivedCard = page.locator('.card', { hasText: title });
  await expect(newlyArchivedCard).toBeVisible({ timeout: 20000 });
  await expect(newlyArchivedCard.locator('.archive-attribution')).toContainText('Test engagement');
  await expect(newlyArchivedCard.locator('.archive-attribution time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:/);
  await newlyArchivedCard.click();
  await expect(page.locator('#dpArchived')).toBeChecked();
  await expect(page.locator('#dpRecommendation')).toHaveValue('recommended');
  await expect(page.locator('#dpEngagementMeta')).toContainText('Test engagement');
  await expect(page.locator('#dpSharedComments')).toContainText('Commentaire créé avec l’article.');

  await page.locator('#dpVote').click();
  await expect(page.locator('#dpVoteCount')).toHaveText('1');
  await page.reload();
  await expect(page.locator('#viewRisks')).toHaveClass(/active/);
  await page.locator('.nav-article[data-scope="archived"]').click();
  const archivedCard = page.locator('.card', { hasText: title });
  await expect(archivedCard).toBeVisible({ timeout: 20000 });
  await expect(archivedCard.locator('.archive-attribution')).toContainText('Test engagement');
  await expect(archivedCard.locator('.archive-attribution time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:/);
  await expect(archivedCard.locator('.rv-upvote')).toHaveCount(1);
  await expect(archivedCard.locator('.card-vote strong')).toHaveText('1');
  await page.screenshot({ path: 'test-results/engagement-desktop.png', fullPage: true });
  await archivedCard.click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#dpArticleDelete').click();
  await expect(page.locator('#ov')).not.toHaveClass(/open/);
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
