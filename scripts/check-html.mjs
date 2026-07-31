import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/<script>\s*'use strict';([\s\S]*)<\/script>/);
if (!match) throw new Error('Script principal introuvable');
new Function(`'use strict';${match[1]}`);
console.log('Syntaxe du script principal valide');
