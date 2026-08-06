import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/<script>\s*'use strict';([\s\S]*)<\/script>/);
if (!match) throw new Error('Script principal introuvable');
new Function(`'use strict';${match[1]}`);

const requiredHomeFragments = [
  '<a class="h-brand" id="btnHome" href="/"',
  'src="assets/carrefour-logo.svg"',
  '<span class="h-name">Veille Risque</span>',
];
for (const fragment of requiredHomeFragments) {
  if (!html.includes(fragment)) {
    throw new Error(`Contrat du bouton d'accueil invalide : ${fragment} est absent`);
  }
}

const requiredEngagementFragments = [
  '.rv-like::before{content:"\\fd94"}',
  '.rv-archive::before{content:"\\f16d"}',
  "['standard','À lire']",
  "['essential','Incontournable']",
  "if(ST.articleScope==='added')return item.shared===true",
  'slot.items=slot.items.slice(0,10)',
  "id:'carrefour-watch-news'",
  "officialSourceIds:['cf-newsroom']",
  'Catégories de risques - Univers de risques Carrefour',
];
for (const fragment of requiredEngagementFragments) {
  if (!html.includes(fragment)) throw new Error(`Contrat fonctionnel invalide : ${fragment} est absent`);
}
if (html.includes("['recommended','Recommandé']") || html.includes('rv-upvote')) {
  throw new Error('Une ancienne recommandation ou flèche d’upvote subsiste dans l’interface');
}

console.log("Syntaxe principale et contrats d'interface valides");
