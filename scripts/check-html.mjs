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

console.log("Syntaxe principale et contrat du bouton d'accueil valides");
