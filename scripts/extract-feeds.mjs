import { readFile, writeFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('const SOURCES = [');
const end = html.indexOf('\n];', start);
if (start < 0 || end < 0) throw new Error('Registre SOURCES introuvable dans index.html');

const block = html.slice(start, end);
const riskFeeds = [];
const pattern = /\{id:'([^']+)',name:'((?:\\'|[^'])*)',url:'([^']+)'/g;
for (const match of block.matchAll(pattern)) {
  riskFeeds.push({
    id: match[1],
    name: match[2].replaceAll("\\'", "'"),
    url: match[3],
  });
}

const competitorStart = html.indexOf('const COMPETITOR_REGISTRY = [');
const competitorEnd = html.indexOf('\n];', competitorStart);
if (competitorStart < 0 || competitorEnd < 0) throw new Error('Registre COMPETITOR_REGISTRY introuvable dans index.html');

const competitorBlock = html.slice(competitorStart, competitorEnd);
const competitorFeeds = [];
const competitorPattern = /\{\s*id:'([^']+)'[\s\S]*?name:'((?:\\'|[^'])*)'[\s\S]*?pays:'(FR|ES|BR)'[\s\S]*?rssQ:'((?:\\'|[^'])*)'/g;
const locales = {
  FR:{ lang:'fr', ceid:'FR:fr' },
  ES:{ lang:'es', ceid:'ES:es' },
  BR:{ lang:'pt-BR', ceid:'BR:pt-419' },
};
for (const match of competitorBlock.matchAll(competitorPattern)) {
  const [, id, rawName, country, query] = match;
  const locale = locales[country];
  competitorFeeds.push({
    id:`competitor-${id}`,
    name:`Veille concurrentielle — ${rawName.replaceAll("\\'", "'")}`,
    url:`https://news.google.com/rss/search?q=${query}&hl=${locale.lang}&gl=${country}&ceid=${locale.ceid}`,
  });
}

if (riskFeeds.length !== 66) throw new Error(`66 sources globales attendues, ${riskFeeds.length} extraites`);
if (competitorFeeds.length !== 18) throw new Error(`18 sources concurrentielles attendues, ${competitorFeeds.length} extraites`);
const feeds = [...riskFeeds, ...competitorFeeds];
await writeFile(new URL('../feeds.generated.json', import.meta.url), JSON.stringify(feeds, null, 2) + '\n');
console.log(`${riskFeeds.length} sources globales et ${competitorFeeds.length} sources concurrentielles exportées`);
