import { readFile, writeFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('const SOURCES = [');
const end = html.indexOf('\n];', start);
if (start < 0 || end < 0) throw new Error('Registre SOURCES introuvable dans index.html');

const block = html.slice(start, end);
const feeds = [];
const pattern = /\{id:'([^']+)',name:'((?:\\'|[^'])*)',url:'([^']+)'/g;
for (const match of block.matchAll(pattern)) {
  feeds.push({
    id: match[1],
    name: match[2].replaceAll("\\'", "'"),
    url: match[3],
  });
}

if (feeds.length !== 66) throw new Error(`66 sources attendues, ${feeds.length} extraites`);
await writeFile(new URL('../feeds.generated.json', import.meta.url), JSON.stringify(feeds, null, 2) + '\n');
console.log(`${feeds.length} sources exportées vers feeds.generated.json`);
