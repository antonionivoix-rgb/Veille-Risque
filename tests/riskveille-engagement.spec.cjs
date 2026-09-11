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

  await expect(home).toContainText('Veille');
  await expect(home.locator('.h-logo-primary')).toHaveAttribute('src', 'assets/brand/peacock-complete.png');
  await expect(home.locator('.h-logo-primary')).toHaveJSProperty('naturalWidth', 770);
  await expect(home).toHaveAttribute('href', '/');

  await page.locator('.nav-geo[data-geo="MONDE"]').click();
  await page.locator('.nav-geo[data-geo="FR"]').click();
  await page.locator('.nav-article[data-scope="archived"]').click();
  await page.locator('[data-sort="recent"]').click();
  await page.locator('#searchInput').fill('test filtre');
  await page.locator('#tabConcurrence').click();
  await expect(page.locator('#sidebar-risks')).toBeHidden();
  await Promise.all([
    page.waitForEvent('framenavigated'),
    home.click(),
  ]);

  await expect(page.locator('#viewRisks')).toHaveClass(/active/);
  await expect(page.locator('.nav-geo[data-geo="MONDE"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.nav-geo[data-geo="FR"]')).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('.nav-article[data-scope="archived"]')).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('.nav-cat[data-code="all"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-sort="recent"]')).toHaveClass(/active/);
  await expect(page.locator('#searchInput')).toHaveValue('');
  await expect(page.locator('#filterState')).not.toContainText('France');
});

test('archives, recommandations, commentaires et votes persistent', async ({ page }) => {
  const title = `Article archive test ${Date.now()}`;
  await login(page, 'Test engagement');

  await expect(page.locator('#sidebarGlobal')).toHaveCount(0);
  await expect(page.locator('.nav-priority')).toHaveCount(0);
  await expect(page.locator('#tabRisks')).toHaveText('Vue globale');
  await expect(page.locator('.nav-article[data-scope="archived"] .rv-archive')).toHaveCount(1);
  await expect(page.locator('.nav-geo').first()).toHaveAttribute('data-geo', 'MONDE');
  await expect(page.locator('.nav-geo[data-geo="MONDE"]')).toHaveAttribute('aria-checked', 'true');

  await page.locator('#btnAddArticle').click();
  await expect(page.locator('#addArtDesc')).toHaveCount(0);
  await expect(page.locator('#addArtRecommendation option')).toHaveCount(2);
  await expect(page.locator('#addArtRecommendation option')).toHaveText(['Intéressant', 'Incontournable']);
  await expect(page.locator('#addArtAiLanguage option')).toHaveText(['Français', 'English']);
  await expect(page.locator('#addArtPays option')).toHaveText(['Monde', 'France', 'Espagne', 'Brésil']);
  await expect(page.locator('#addArtPays')).toHaveValue('MONDE');
  await page.locator('#addArtUrl').fill(`https://example.com/riskveille/${Date.now()}`);
  await page.locator('#addArtTitle').fill(title);
  await page.locator('#addArtComment').fill('Commentaire créé avec l’article.');
  await page.locator('#addArtRecommendation').selectOption('essential');
  await page.locator('#addArtArchived').check();
  await page.locator('#addArtSubmit').click();
  await expect(page.locator('#addArticleOv')).not.toHaveClass(/open/);

  await page.locator('.nav-article[data-scope="added"]').click();
  await expect(page.locator('.card', { hasText: title })).toBeVisible({ timeout: 20000 });
  await page.locator('.nav-article[data-scope="added"]').click();
  await page.locator('.nav-article[data-scope="archived"]').click();
  const newlyArchivedCard = page.locator('.card', { hasText: title });
  await expect(newlyArchivedCard).toBeVisible({ timeout: 20000 });
  await expect(newlyArchivedCard.locator('.archive-attribution')).toContainText('Test engagement');
  await expect(newlyArchivedCard.locator('.archive-attribution time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:/);
  await newlyArchivedCard.click();
  await expect(page.locator('#dpArchived')).toBeChecked();
  await expect(page.locator('#dpRecommendation')).toHaveValue('essential');
  await expect(page.locator('#dpEngagementMeta')).toContainText('Test engagement');
  await expect(page.locator('#dpSharedComments')).toContainText('Commentaire créé avec l’article.');
  await expect(page.locator('#dpAiLanguage option')).toHaveText(['Français', 'English']);
  await expect(page.locator('#dpGeoSelect')).toHaveValue('MONDE');
  await expect(page.locator('#dpMeta')).toContainText('Monde');

  await page.locator('#dpGeoSelect').selectOption('ES');
  await page.locator('#dpClassSave').click();
  await expect(page.locator('#dpMeta')).toContainText('Espagne', { timeout: 10000 });
  await expect(page.locator('#dpGeoSelect')).toHaveValue('ES');
  await page.locator('#dpGeoSelect').selectOption('MONDE');
  await page.locator('#dpClassSave').click();
  await expect(page.locator('#dpMeta')).toContainText('Monde', { timeout: 10000 });
  await expect(page.locator('#dpGeoSelect')).toHaveValue('MONDE');

  const voteColorsBefore = await page.locator('#dpVote').evaluate(node => {
    const style = getComputedStyle(node);
    return [style.color, style.backgroundColor, style.borderColor];
  });
  await page.locator('#dpVote').click();
  await page.mouse.move(0, 0);
  await expect(page.locator('#dpVoteCount')).toHaveText('1');
  await expect(page.locator('#dpVote')).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(250);
  const voteColorsAfter = await page.locator('#dpVote').evaluate(node => {
    const style = getComputedStyle(node);
    return [style.color, style.backgroundColor, style.borderColor];
  });
  expect(voteColorsAfter).toEqual(voteColorsBefore);
  await page.reload();
  await expect(page.locator('#viewRisks')).toHaveClass(/active/);
  await page.locator('.nav-article[data-scope="archived"]').click();
  const archivedCard = page.locator('.card', { hasText: title });
  await expect(archivedCard).toBeVisible({ timeout: 20000 });
  await expect(archivedCard.locator('.archive-attribution')).toContainText('Test engagement');
  await expect(archivedCard.locator('.archive-attribution time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:/);
  await expect(archivedCard.locator('.rv-like')).toHaveCount(1);
  await expect(archivedCard.locator('.card-vote strong')).toHaveText('1');
  await page.screenshot({ path: 'test-results/engagement-desktop.png', fullPage: true });
  await archivedCard.click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#dpArticleDelete').click();
  await expect(page.locator('#ov')).not.toHaveClass(/open/);
});

test('la veille Carrefour est plafonnée et partage le menu des archives', async ({ page }) => {
  const title = `Article Carrefour archive test ${Date.now()}`;
  await login(page, 'Test Carrefour');

  await page.locator('#tabConcurrence').click();
  const carrefourCard = page.locator('.comp-card[data-comp-id="carrefour"]');
  await expect(carrefourCard).toBeVisible({ timeout: 20000 });
  await page.screenshot({ path: 'test-results/carrefour-desktop.png', fullPage: true });
  await carrefourCard.locator('.comp-cta').click();
  await expect(page.locator('#compPanelOverlay')).toHaveClass(/open/);
  await page.waitForTimeout(400);
  expect(await page.locator('#compAlertsList .cp-alert-card').count()).toBeLessThanOrEqual(10);
  const backToGrid = page.locator('#compBackToGrid');
  await expect(backToGrid).toBeInViewport();
  await backToGrid.click();

  await page.locator('#btnAddCompArticle').click();
  await expect(page.locator('#addCompArticleCompetitor')).toHaveValue('carrefour');
  await page.locator('#addCompArticleUrl').fill(`https://example.com/carrefour/${Date.now()}`);
  await page.locator('#addCompArticleTitle').fill(title);
  await page.locator('#addCompArticleRecommendation').selectOption('essential');
  await page.locator('#addCompArticleArchived').check();
  await page.locator('#addCompArticleSubmit').click();
  await expect(page.locator('#addCompArticleOv')).not.toHaveClass(/open/);

  await page.locator('#tabRisks').click();
  await page.locator('.nav-article[data-scope="archived"]').click();
  const archivedCard = page.locator('.card', { hasText: title });
  await expect(archivedCard).toBeVisible({ timeout: 20000 });
  await archivedCard.click();
  await expect(page.locator('#dpArchived')).toBeChecked();
  await expect(page.locator('#dpVote .rv-like')).toHaveCount(1);
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
  await expect(page.locator('[data-ui-lang="fr"]')).toBeVisible();
  await expect(page.locator('.team-avatar')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.waitForTimeout(350);
  await page.screenshot({ path: 'test-results/engagement-mobile.png', fullPage: true });
  await page.locator('#sidebarClose').click();
  await page.locator('#tabConcurrence').click();
  await expect(page.locator('#sidebar-risks')).toBeHidden();
  await expect(page.locator('.comp-card').first()).toBeVisible({ timeout: 20000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/competitive-mobile.png', fullPage: true });
});

test('interface bilingue, avatars et cartes concurrentielles restent lisibles', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page, 'Test bilingue');

  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('[data-ui-lang="fr"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.nav-cat .category-icon')).toHaveCount(11);
  await expect(page.locator('.team-avatar')).toHaveCount(4);
  await expect(page.locator('.team-tooltip-name')).toHaveText([
    'Guillaume Litvak',
    'Chi Buisson',
    'Antonio Nivoix',
    'Mathilde Blataj',
  ]);
  await expect(page.locator('.team-avatar').first()).toHaveAttribute('href', 'mailto:argos@carrefour.com');
  await page.locator('.team-avatar').first().hover();
  await page.waitForTimeout(250);
  const firstTooltip = page.locator('.team-avatar').first().locator('.team-tooltip');
  await expect(firstTooltip.locator('.team-tooltip-name')).toHaveText('Guillaume Litvak');
  await expect(firstTooltip.locator('.team-tooltip-email')).toHaveText('argos@carrefour.com');
  await expect(firstTooltip).toHaveCSS('opacity', '1');

  await page.locator('#tabConcurrence').click();
  await expect(page.locator('#sidebar-risks')).toBeHidden();
  await expect(page.locator('.comp-card').first()).toBeVisible({ timeout: 20000 });
  const competitiveStyles = await page.locator('.comp-news-title').first().evaluate(node => ({
    lineClamp: getComputedStyle(node).webkitLineClamp,
    overflow: getComputedStyle(node).overflow,
    textAlign: getComputedStyle(node).textAlign,
    mainMargin: getComputedStyle(document.querySelector('.main')).marginLeft,
  }));
  expect(['', 'none']).toContain(competitiveStyles.lineClamp);
  expect(competitiveStyles.overflow).toBe('visible');
  expect(competitiveStyles.textAlign).toBe('center');
  expect(competitiveStyles.mainMargin).toBe('0px');
  const compactNewsLayout = await page.locator('.comp-news-item').first().evaluate(node => {
    const copy = node.querySelector(':scope > .comp-news-copy');
    const marker = node.querySelector(':scope > .comp-news-marker');
    const date = node.querySelector(':scope > .comp-news-date');
    const copyRect = copy.getBoundingClientRect();
    const childRects = [...copy.children].map(child => child.getBoundingClientRect());
    return {
      itemDisplay: getComputedStyle(node).display,
      copyDirection: getComputedStyle(copy).flexDirection,
      markerIsSibling: Boolean(marker),
      dateIsSibling: Boolean(date),
      copyWidth: copyRect.width,
      childWidths: childRects.map(rect => rect.width),
      childrenStacked: childRects.every((rect, index) => index === 0 || rect.top >= childRects[index - 1].bottom - 1),
    };
  });
  expect(compactNewsLayout.itemDisplay).toBe('grid');
  expect(compactNewsLayout.copyDirection).toBe('column');
  expect(compactNewsLayout.markerIsSibling).toBe(true);
  expect(compactNewsLayout.dateIsSibling).toBe(true);
  expect(compactNewsLayout.copyWidth).toBeGreaterThan(200);
  expect(compactNewsLayout.childWidths.every(width => width > 200)).toBe(true);
  expect(compactNewsLayout.childrenStacked).toBe(true);
  const mercadona = page.locator('.comp-card[data-comp-id="mercadona"]');
  await expect(mercadona).toBeVisible();
  await expect(mercadona.locator('.comp-name')).toHaveText('Mercadona');
  const mercadonaStyles = await mercadona.evaluate(node => {
    const name = node.querySelector('.comp-name');
    const segment = node.querySelector('.comp-seg');
    return {
      nameWritingMode: getComputedStyle(name).writingMode,
      nameWordBreak: getComputedStyle(name).wordBreak,
      segmentWritingMode: getComputedStyle(segment).writingMode,
      segmentWordBreak: getComputedStyle(segment).wordBreak,
      cardWidth: node.getBoundingClientRect().width,
      nameWidth: name.getBoundingClientRect().width,
    };
  });
  expect(mercadonaStyles.nameWritingMode).toBe('horizontal-tb');
  expect(mercadonaStyles.nameWordBreak).toBe('normal');
  expect(mercadonaStyles.segmentWritingMode).toBe('horizontal-tb');
  expect(mercadonaStyles.segmentWordBreak).toBe('normal');
  expect(mercadonaStyles.cardWidth).toBeGreaterThanOrEqual(300);
  expect(mercadonaStyles.nameWidth).toBeGreaterThan(80);
  await mercadona.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -80));
  await page.waitForTimeout(800);
  await expect(mercadona).toHaveAttribute('data-comp-id', 'mercadona');
  await expect(mercadona.locator('.comp-name')).toHaveText('Mercadona');
  await mercadona.screenshot({ path: 'test-results/mercadona-small-french.png' });

  await page.locator('[data-ui-lang="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#tabRisks')).toHaveText('Overview');
  await expect(page.locator('#tabConcurrence')).toHaveText('Competitive intelligence');
  await expect(page.locator('#ccModeDescription')).toHaveText('Select a retailer to view details.');
  await expect(page.locator('[data-ui-lang="en"]')).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: 'test-results/bilingual-competitive-desktop.png', fullPage: true });

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('#tabRisks')).toHaveText('Vue globale');
});
