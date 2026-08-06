import { access, readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const worker = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
const summaryLanguageMigration = await readFile(new URL('../migrations/0009_ai_summary_languages.sql', import.meta.url), 'utf8');
const match = html.match(/<script>\s*'use strict';([\s\S]*)<\/script>/);
if (!match) throw new Error('Script principal introuvable');
new Function(`'use strict';${match[1]}`);

const requiredHomeFragments = [
  '<a class="h-brand" id="btnHome" href="/"',
  'src="assets/brand/peacock.png"',
  '<span class="h-name">Veille</span>',
];
for (const fragment of requiredHomeFragments) {
  if (!html.includes(fragment)) {
    throw new Error(`Contrat du bouton d'accueil invalide : ${fragment} est absent`);
  }
}

const requiredEngagementFragments = [
  '.rv-like::before{content:"\\fd94"}',
  '.rv-archive::before{content:"\\f16d"}',
  "['standard',t('recommendation.standard')]",
  "['essential',t('recommendation.essential')]",
  "if(ST.articleScope==='added')return item.shared===true",
  'slot.items=slot.items.slice(0,10)',
  "id:'carrefour-watch-news'",
  "officialSourceIds:['cf-newsroom']",
  'Catégories de risques - Univers de risques Carrefour',
];
for (const fragment of requiredEngagementFragments) {
  if (!html.includes(fragment)) throw new Error(`Contrat fonctionnel invalide : ${fragment} est absent`);
}

const requiredGraphicAndLanguageFragments = [
  "icon:'assets/risk-categories/A.png'",
  "icon:'assets/risk-categories/K.png'",
  'data-ui-lang="fr"',
  'data-ui-lang="en"',
  'src="assets/flags/gb.svg"',
  'src="assets/avatars/guillaume-litvak.png"',
  'src="assets/avatars/chi.png"',
  'src="assets/avatars/antonio-nivoix.png"',
  'src="assets/avatars/mathilde-blataj.png"',
  "body.view-concurrence .sidebar",
  'id="dpAiLanguage"',
  'id="addArtAiLanguage"',
  'id="addCompArticleAiLanguage"',
  "function aiSummaryKey(articleId,language='fr')",
];
for (const fragment of requiredGraphicAndLanguageFragments) {
  if (!html.includes(fragment)) throw new Error(`Contrat graphique ou bilingue invalide : ${fragment} est absent`);
}
const requiredAssets = [
  'brand/peacock.png','flags/gb.svg','avatars/guillaume-litvak.png','avatars/chi.png',
  'avatars/antonio-nivoix.png','avatars/mathilde-blataj.png',
  ...'ABCDEFGHIJK'.split('').map(code=>`risk-categories/${code}.png`),
];
await Promise.all(requiredAssets.map(path=>access(new URL(`../assets/${path}`, import.meta.url))));
if (html.includes('src="assets/carrefour-logo.svg"') || html.includes('<span class="h-name">Veille Risque</span>')) {
  throw new Error("L'ancien logo ou l'ancien libellé du menu principal subsiste");
}

const requiredAiLanguageFragments = [
  [worker, 'article_ai_summaries_i18n WHERE article_id=? AND language=?'],
  [worker, 'generateArticleSummary(env, sourceText, summaryLanguage)'],
  [worker, "const prefix = language === 'en' ? /^Key figures"],
  [summaryLanguageMigration, "SELECT article_id, 'fr', bullets_json"],
  [summaryLanguageMigration, 'PRIMARY KEY (article_id, language)'],
];
for (const [source, fragment] of requiredAiLanguageFragments) {
  if (!source.includes(fragment)) throw new Error(`Contrat des résumés bilingues invalide : ${fragment} est absent`);
}
if (html.includes("['recommended','Recommandé']") || html.includes('rv-upvote')) {
  throw new Error('Une ancienne recommandation ou flèche d’upvote subsiste dans l’interface');
}

console.log("Syntaxe principale et contrats d'interface valides");
