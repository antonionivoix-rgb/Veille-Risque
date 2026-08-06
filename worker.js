import { XMLParser } from 'fast-xml-parser';
import puppeteer from '@cloudflare/puppeteer';
import feeds from './feeds.generated.json';
import { trimReaderArticleText } from './article-reader.js';

const PASSWORD_HASH = '421b5c971bccb446465230ac63ce7cdef599fd628855297bd149296efed19b1e';
const SESSION_DAYS = 30;
const REFRESH_BATCH_SIZE = 12;
const MAX_FEED_ITEMS = 30;
const ALLOWED_ORIGINS = new Set([
  'https://antonionivoix-rgb.github.io',
  'https://riskveillecrf-824.pages.dev',
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  cdataPropName: '#cdata',
  trimValues: true,
  processEntities: true,
});

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const local = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
  const pagesPreview = /^https:\/\/[a-z0-9-]+\.riskveillecrf-824\.pages\.dev$/.test(origin);
  const allowed = ALLOWED_ORIGINS.has(origin) || local || pagesPreview ? origin : '';
  return {
    ...(allowed ? { 'Access-Control-Allow-Origin': allowed } : {}),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  };
}

function json(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(request) },
  });
}

function cleanText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function cleanArticleText(value, maxLength = 16000) {
  return cleanText(String(value || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'"), maxLength);
}

function isPublicArticleUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (!host || host === 'localhost' || host.endsWith('.local') || host === '0.0.0.0' || host === '::1') return false;
    if (/^127\./.test(host) || /^10\./.test(host) || /^169\.254\./.test(host) || /^192\.168\./.test(host)) return false;
    const private172 = host.match(/^172\.(\d{1,3})\./);
    if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return false;
    if (/^(fc|fd|fe8|fe9|fea|feb)/i.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

async function fetchPublicArticle(url, maxRedirects = 4) {
  let current = url;
  for (let redirect = 0; redirect <= maxRedirects; redirect++) {
    if (!isPublicArticleUrl(current)) throw new Error('Adresse de l’article non autorisée.');
    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
      headers: {
        'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.2',
        'User-Agent': 'RiskVeille/1.0 (+https://riskveillecrf-824.pages.dev)',
      },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('Location');
      if (!location || redirect === maxRedirects) throw new Error('Trop de redirections.');
      current = new URL(location, current).toString();
      continue;
    }
    return response;
  }
  throw new Error('Article inaccessible.');
}

function paragraphCollector(limit = 18000) {
  const chunks = [];
  let length = 0;
  return {
    handler: {
      element() {
        if (length < limit) chunks.push('\n');
      },
      text(textChunk) {
        if (length >= limit) return;
        const value = textChunk.text || '';
        chunks.push(value.slice(0, limit - length));
        length += value.length;
      },
    },
    value() { return cleanArticleText(chunks.join(' '), limit); },
  };
}

async function extractArticleText(url) {
  const response = await fetchPublicArticle(url);
  if (!response.ok) throw new Error(`Article inaccessible (HTTP ${response.status}).`);
  const contentLength = Number(response.headers.get('Content-Length') || 0);
  if (contentLength > 5_000_000) throw new Error('Page trop volumineuse.');
  const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
  if (contentType.includes('text/plain')) return cleanArticleText(await response.text());
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    throw new Error('La page ne fournit pas de contenu texte exploitable.');
  }
  const article = paragraphCollector();
  const main = paragraphCollector();
  const page = paragraphCollector();
  const transformed = new HTMLRewriter()
    .on('article p', article.handler)
    .on('main p', main.handler)
    .on('body p', page.handler)
    .transform(response);
  await transformed.arrayBuffer();
  const candidates = [article.value(), main.value(), page.value()];
  return candidates.find(text => text.length >= 500) || candidates.find(text => text.length >= 160) || '';
}

async function extractArticleTextViaBrowser(env, url) {
  if (!env.BROWSER) throw new Error('Le navigateur d’extraction n’est pas configuré.');
  if (!isPublicArticleUrl(url)) throw new Error('Adresse de l’article non autorisée.');
  const browser = await puppeteer.launch(env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    try { await page.waitForSelector('article p, main p', { timeout: 5000 }); } catch {}
    const extracted = await page.evaluate(() => {
      const structuredBodies = [];
      for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
        try {
          const queue = [JSON.parse(script.textContent || 'null')];
          let visited = 0;
          while (queue.length && visited < 400) {
            const value = queue.shift();
            visited++;
            if (!value || typeof value !== 'object') continue;
            if (typeof value.articleBody === 'string') structuredBodies.push(value.articleBody);
            if (Array.isArray(value)) queue.push(...value);
            else queue.push(...Object.values(value).filter(item => item && typeof item === 'object'));
          }
        } catch {}
      }
      const structured = structuredBodies.sort((a, b) => b.length - a.length)[0] || '';
      const root = document.querySelector('article') || document.querySelector('main') || document.body;
      const paragraphs = [...root.querySelectorAll('p')]
        .map(node => node.textContent?.trim() || '')
        .filter(Boolean)
        .join('\n');
      const meta = document.querySelector('meta[name="description"], meta[property="og:description"]')?.content || '';
      const body = structured.length >= 160 ? structured : paragraphs;
      return `${meta}\n${body}`.trim().slice(0, 100000);
    });
    return cleanArticleText(extracted);
  } finally {
    try { await browser.close(); } catch {}
  }
}

function parseAiSummary(result) {
  const direct = result?.response && typeof result.response === 'object' ? result.response : null;
  if (Array.isArray(direct?.bullets)) {
    const bullets = direct.bullets.map(value => cleanText(value, 650)).filter(Boolean);
    return bullets.length === 4 ? bullets : null;
  }
  const raw = typeof result?.response === 'string' ? result.response.trim() : '';
  if (!raw) return null;
  let bullets = [];
  try {
    const unfenced = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(unfenced);
    bullets = Array.isArray(parsed) ? parsed : parsed?.bullets;
  } catch {
    bullets = raw.split(/\r?\n/)
      .map(line => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
      .filter(Boolean);
  }
  if (!Array.isArray(bullets)) return null;
  bullets = bullets.map(value => cleanText(value, 650)).filter(Boolean);
  return bullets.length === 4 ? bullets : null;
}

function isUsableAiSummary(bullets, sourceText) {
  if (!Array.isArray(bullets) || bullets.length !== 4 || new Set(bullets).size !== 4) return false;
  const figures = bullets[3] || '';
  if (!/^Chiffres clés\s*:/i.test(figures)) return false;
  const detail = figures.replace(/^Chiffres clés\s*:\s*/i, '').trim();
  if (detail.length < 12) return false;
  if (/aucun chiffre/i.test(detail) && /\d/.test(sourceText)) return false;
  return true;
}

async function generateArticleSummary(env, sourceText) {
  if (!env.AI?.run) throw new Error('Le service de résumé par IA n’est pas configuré.');
  const messages = [
    {
      role: 'system',
      content: `Tu résumes des articles pour une équipe de risques stratégiques de Carrefour. Réponds en français avec un objet JSON strict de la forme {"bullets":["...","...","...","..."]}. Le tableau doit contenir exactement quatre puces autonomes et factuelles. Les trois premières présentent, sans répétition, les idées centrales les plus utiles. La quatrième commence par « Chiffres clés : » et regroupe tous les chiffres, montants, pourcentages et dates utiles présents dans le contenu. N’écris « aucun chiffre clé n’est fourni dans le contenu accessible » que si le contenu ne contient réellement aucun chiffre utile. La quatrième puce doit former une phrase complète après les deux-points. Chaque puce compte au maximum 45 mots. Conserve fidèlement les noms propres et les noms officiels d’organisations. N’invente jamais une information, un chiffre ou un contexte absent. Si le contenu est partiel, signale sobrement cette limite dans une puce. N’ajoute aucune introduction ni conclusion.`,
    },
    {
      role: 'user',
      content: `Contenu à résumer :\n\n${sourceText.slice(0, 16000)}`,
    },
  ];
  let previous = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const attemptMessages = previous ? [
      ...messages,
      { role: 'assistant', content: JSON.stringify({ bullets: previous }) },
      { role: 'user', content: 'Corrige entièrement ce résumé. La quatrième puce était vide, incomplète ou incohérente avec les chiffres du contenu. Respecte strictement les quatre puces demandées, sans répétition.' },
    ] : messages;
    const result = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
      messages: attemptMessages,
      temperature: 0.2,
      max_tokens: 520,
      response_format: {
        type: 'json_schema',
        json_schema: {
          type: 'object',
          properties: {
            bullets: {
              type: 'array',
              items: { type: 'string', minLength: 35 },
              minItems: 4,
              maxItems: 4,
            },
          },
          required: ['bullets'],
          additionalProperties: false,
        },
      },
    });
    const bullets = parseAiSummary(result);
    if (isUsableAiSummary(bullets, sourceText)) return bullets;
    previous = bullets;
  }
  throw new Error('Le résumé généré ne respecte pas le format attendu.');
}

function valueOf(node) {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
  if (Array.isArray(node)) return valueOf(node[0]);
  return valueOf(node['#text'] ?? node['#cdata'] ?? '');
}

function atomLink(link) {
  const links = Array.isArray(link) ? link : [link];
  const preferred = links.find(item => !item?.['@_rel'] || item['@_rel'] === 'alternate') || links[0];
  return cleanText(preferred?.['@_href'] || valueOf(preferred), 2000);
}

function normalizeFeedItem(item, atom = false) {
  const source = item?.source;
  return {
    title: cleanText(valueOf(item?.title), 700),
    link: atom ? atomLink(item?.link) : cleanText(valueOf(item?.link) || item?.guid?.['#text'], 2000),
    pubDate: cleanText(
      atom
        ? valueOf(item?.published) || valueOf(item?.updated)
        : valueOf(item?.pubDate) || valueOf(item?.['dc:date']) || valueOf(item?.date),
      120,
    ),
    sourceName: cleanText(valueOf(source), 200),
    sourceUrl: cleanText(source?.['@_url'], 1000),
    description: cleanText(
      valueOf(item?.description) || valueOf(item?.summary) || valueOf(item?.['content:encoded']) || valueOf(item?.content),
      4000,
    ),
  };
}

function parseXmlFeed(xml) {
  const document = parser.parse(xml);
  const rssChannel = document?.rss?.channel;
  const rssItems = rssChannel?.item ?? document?.RDF?.item ?? document?.['rdf:RDF']?.item;
  if (rssChannel || rssItems) {
    if (!rssItems) return [];
    const list = Array.isArray(rssItems) ? rssItems : [rssItems];
    return list.map(item => normalizeFeedItem(item, false)).filter(item => item.title).slice(0, MAX_FEED_ITEMS);
  }
  const atomEntries = document?.feed?.entry;
  if (atomEntries) {
    const list = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
    return list.map(item => normalizeFeedItem(item, true)).filter(item => item.title).slice(0, MAX_FEED_ITEMS);
  }
  throw new Error('Format RSS ou Atom non reconnu');
}

async function fetchWithTimeout(url, timeoutMs = 12000) {
  return fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json;q=0.8, */*;q=0.2',
      'User-Agent': 'RiskVeille/1.0 (+https://riskveillecrf-824.pages.dev)',
    },
  });
}

async function fetchFeed(source) {
  let directError = '';
  try {
    const response = await fetchWithTimeout(source.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = await response.text();
    const items = parseXmlFeed(raw);
    return { items, via: 'direct' };
  } catch (error) {
    directError = error?.message || String(error);
  }

  if (source.url.startsWith('https://news.google.com/')) {
    try {
      const relayUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(source.url);
      const relay = await fetchWithTimeout(relayUrl, 18000);
      if (!relay.ok) throw new Error(`HTTP ${relay.status}`);
      const items = parseXmlFeed(await relay.text());
      return { items, via: 'allorigins' };
    } catch (error) {
      directError += `; relais ${error?.message || String(error)}`;
    }
  }

  const fallbackUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(source.url);
  const fallback = await fetchWithTimeout(fallbackUrl);
  if (!fallback.ok) throw new Error(`${directError}; relais HTTP ${fallback.status}`);
  const data = await fallback.json();
  if (data.status !== 'ok' || !Array.isArray(data.items)) throw new Error(`${directError}; relais invalide`);
  const items = data.items.map(item => ({
    title: cleanText(item.title, 700),
    link: cleanText(item.link, 2000),
    pubDate: cleanText(item.pubDate, 120),
    sourceName: cleanText(item.author || '', 200),
    sourceUrl: '',
    description: cleanText(item.description || item.content || '', 4000),
  })).filter(item => item.title).slice(0, MAX_FEED_ITEMS);
  return { items, via: 'rss2json' };
}

async function refreshOne(env, source) {
  const now = new Date().toISOString();
  try {
    const result = await fetchFeed(source);
    await env.DB.prepare(`
      INSERT INTO feed_cache(source_id, payload, status, item_count, fetched_at, last_success_at, last_error)
      VALUES (?, ?, 'ok', ?, ?, ?, NULL)
      ON CONFLICT(source_id) DO UPDATE SET
        payload=excluded.payload, status='ok', item_count=excluded.item_count,
        fetched_at=excluded.fetched_at, last_success_at=excluded.last_success_at, last_error=NULL
    `).bind(source.id, JSON.stringify(result.items), result.items.length, now, now).run();
    return { id: source.id, ok: true, count: result.items.length, via: result.via };
  } catch (error) {
    const message = cleanText(error?.message || String(error), 500);
    await env.DB.prepare(`
      INSERT INTO feed_cache(source_id, payload, status, item_count, fetched_at, last_error)
      VALUES (?, '[]', 'error', 0, ?, ?)
      ON CONFLICT(source_id) DO UPDATE SET status='error', fetched_at=excluded.fetched_at, last_error=excluded.last_error
    `).bind(source.id, now, message).run();
    return { id: source.id, ok: false, error: message };
  }
}

async function refreshBatch(env, requestedIds = null) {
  let selected;
  if (Array.isArray(requestedIds) && requestedIds.length) {
    const ids = new Set(requestedIds);
    selected = feeds.filter(source => ids.has(source.id)).slice(0, REFRESH_BATCH_SIZE);
  } else {
    const state = await env.DB.prepare("SELECT value FROM system_state WHERE key='refresh_cursor'").first();
    const cursor = Number.parseInt(state?.value || '0', 10) || 0;
    selected = Array.from({ length: Math.min(REFRESH_BATCH_SIZE, feeds.length) }, (_, index) => feeds[(cursor + index) % feeds.length]);
    const next = (cursor + selected.length) % feeds.length;
    await env.DB.prepare("INSERT INTO system_state(key,value) VALUES('refresh_cursor',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(next)).run();
  }
  return Promise.all(selected.map(source => refreshOne(env, source)));
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function readBody(request) {
  try { return await request.json(); }
  catch { return null; }
}

async function sessionFor(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  return env.DB.prepare('SELECT token, display_name FROM sessions WHERE token=? AND expires_at>?')
    .bind(token, new Date().toISOString()).first();
}

function decodeJwtPart(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(normalized), char => char.charCodeAt(0));
}

async function verifyGithubOidc(request) {
  const headerValue = request.headers.get('Authorization') || '';
  const token = headerValue.startsWith('Bearer ') ? headerValue.slice(7).trim() : '';
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const header = JSON.parse(new TextDecoder().decode(decodeJwtPart(parts[0])));
    const claims = JSON.parse(new TextDecoder().decode(decodeJwtPart(parts[1])));
    const now = Math.floor(Date.now() / 1000);
    const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (header.alg !== 'RS256' || claims.iss !== 'https://token.actions.githubusercontent.com') return false;
    if (!audience.includes('riskveille') || claims.repository?.toLowerCase() !== 'antonionivoix-rgb/veille-risque') return false;
    if (claims.exp < now || claims.nbf > now + 30) return false;
    if (!['schedule','workflow_dispatch'].includes(claims.event_name)) return false;
    const response = await fetch('https://token.actions.githubusercontent.com/.well-known/jwks', { cf:{cacheTtl:3600,cacheEverything:true} });
    if (!response.ok) return false;
    const jwks = await response.json();
    const jwk = jwks.keys?.find(key => key.kid === header.kid);
    if (!jwk) return false;
    const key = await crypto.subtle.importKey('jwk', jwk, { name:'RSASSA-PKCS1-v1_5', hash:'SHA-256' }, false, ['verify']);
    const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decodeJwtPart(parts[2]), signed);
  } catch {
    return false;
  }
}

async function ingestFeed(request, env) {
  const body = await readBody(request);
  const source = feeds.find(item => item.id === body?.sourceId);
  if (!source || !Array.isArray(body?.items)) return json(request, { error: 'Flux ou source invalide.' }, 400);
  const items = body.items.slice(0, MAX_FEED_ITEMS).map(item => ({
    title: cleanText(item.title, 700), link: cleanText(item.link, 2000), pubDate: cleanText(item.pubDate, 120),
    sourceName: cleanText(item.sourceName, 200), sourceUrl: cleanText(item.sourceUrl, 1000), description: cleanText(item.description, 4000),
  })).filter(item => item.title);
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO feed_cache(source_id, payload, status, item_count, fetched_at, last_success_at, last_error)
    VALUES (?, ?, 'ok', ?, ?, ?, NULL)
    ON CONFLICT(source_id) DO UPDATE SET payload=excluded.payload, status='ok', item_count=excluded.item_count,
    fetched_at=excluded.fetched_at, last_success_at=excluded.last_success_at, last_error=NULL
  `).bind(source.id, JSON.stringify(items), items.length, now, now).run();
  return json(request, { accepted: true, sourceId: source.id, itemCount: items.length });
}

function validCatCode(value) {
  return /^[A-K]$/.test(String(value || ''));
}

const COMPETITOR_IDS = new Set([
  'carrefour',
  'leclerc', 'auchan', 'lidl-fr', 'intermarche', 'casino', 'aldi-fr', 'monoprix', 'franprix', 'systeme-u',
  'mercadona', 'dia', 'lidl-es', 'eroski', 'alcampo',
  'assai', 'gpa', 'grupo-mateus', 'cencosud-br',
]);

function validCompetitorId(value) {
  return COMPETITOR_IDS.has(String(value || ''));
}

const RECOMMENDATIONS = new Set(['standard', 'essential']);

function cleanRecommendation(value) {
  const recommendation = cleanText(value, 24);
  return RECOMMENDATIONS.has(recommendation) ? recommendation : 'standard';
}

function cleanArticleSnapshot(value, articleId) {
  if (!value || typeof value !== 'object') return null;
  const title = cleanArticleText(value.title, 700);
  const link = cleanText(value.link, 2000);
  if (!title || !link) return null;
  const parsedDate = new Date(value.date);
  return {
    id: articleId,
    title,
    link,
    desc: cleanArticleText(value.desc, 3000),
    date: Number.isFinite(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString(),
    source: cleanText(value.source, 180) || 'Source archivée',
    sourceId: cleanText(value.sourceId, 120),
    catCode: validCatCode(value.catCode) ? value.catCode : 'A',
    pays: new Set(['FR', 'ES', 'BR', 'MONDE']).has(value.pays) ? value.pays : 'MONDE',
    lang: cleanText(value.lang, 8) || 'fr',
    label: cleanText(value.label, 240),
    macro: value.macro === true,
    custom: value.custom === true,
    shared: value.shared === true,
    addedBy: cleanText(value.addedBy, 80),
    competitorId: validCompetitorId(value.competitorId) ? value.competitorId : null,
  };
}

async function handleApi(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });

  if (path === '/api/health') {
    return json(request, { ok: true, sources: feeds.length, now: new Date().toISOString() });
  }

  if (path === '/api/session' && request.method === 'POST') {
    const body = await readBody(request);
    const displayName = cleanText(body?.displayName, 40);
    const password = String(body?.password || '');
    if (displayName.length < 2) return json(request, { error: 'Le nom doit contenir au moins deux caractères.' }, 400);
    if (await sha256(password) !== PASSWORD_HASH) return json(request, { error: 'Mot de passe incorrect.' }, 401);
    const token = `${crypto.randomUUID()}${crypto.randomUUID().replaceAll('-', '')}`;
    const now = new Date();
    const expires = new Date(now.getTime() + SESSION_DAYS * 86400000);
    await env.DB.prepare('INSERT INTO sessions(token, display_name, created_at, expires_at) VALUES(?,?,?,?)')
      .bind(token, displayName, now.toISOString(), expires.toISOString()).run();
    ctx.waitUntil(env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now.toISOString()).run());
    return json(request, { token, displayName, expiresAt: expires.toISOString() });
  }

  if (path === '/api/feeds/ingest' && request.method === 'POST') {
    const session = await sessionFor(request, env);
    if (!session && !await verifyGithubOidc(request)) return json(request, { error: 'Collecteur non autorisé.' }, 401);
    return ingestFeed(request, env);
  }

  const session = await sessionFor(request, env);
  if (!session) return json(request, { error: 'Session expirée. Reconnectez-vous.' }, 401);

  if (path === '/api/session' && request.method === 'GET') {
    return json(request, { valid: true, displayName: session.display_name });
  }

  if (path === '/api/feeds' && request.method === 'GET') {
    const result = await env.DB.prepare('SELECT source_id, payload, status, item_count, fetched_at, last_success_at, last_error FROM feed_cache').all();
    const rows = new Map((result.results || []).map(row => [row.source_id, row]));
    const missing = feeds.filter(source => !rows.has(source.id)).map(source => source.id);
    const staleBefore = Date.now() - 30 * 60 * 1000;
    const stale = feeds.filter(source => {
      const row = rows.get(source.id);
      return row && (!row.fetched_at || new Date(row.fetched_at).getTime() < staleBefore);
    }).map(source => source.id);
    if (missing.length || stale.length) ctx.waitUntil(refreshBatch(env, [...missing, ...stale].slice(0, REFRESH_BATCH_SIZE)));

    const sources = feeds.map(source => {
      const row = rows.get(source.id);
      let items = [];
      try { items = JSON.parse(row?.payload || '[]'); } catch {}
      return {
        id: source.id,
        name: source.name,
        status: row?.status || 'pending',
        fetchedAt: row?.fetched_at || null,
        lastSuccessAt: row?.last_success_at || null,
        error: row?.last_error || null,
        items,
      };
    });
    const accessible = sources.filter(source => source.lastSuccessAt).length;
    const unavailable = sources.filter(source => source.status === 'error' && !source.lastSuccessAt).length;
    const revision = sources.reduce((latest, source) => source.fetchedAt && source.fetchedAt > latest ? source.fetchedAt : latest, '');
    return json(request, { revision: revision || null, sources, metrics: { total: feeds.length, accessible, unavailable, pending: feeds.length - accessible - unavailable } });
  }

  if (path === '/api/refresh' && request.method === 'POST') {
    const body = await readBody(request);
    const requested = Array.isArray(body?.sourceIds) ? body.sourceIds.map(String) : null;
    ctx.waitUntil(refreshBatch(env, requested));
    return json(request, { accepted: true, batchSize: Math.min(requested?.length || REFRESH_BATCH_SIZE, REFRESH_BATCH_SIZE) }, 202);
  }

  if (path === '/api/shared' && request.method === 'GET') {
    const [comments, overrides, articles, engagements, votes, aiSummaryVersions, feedState] = await Promise.all([
      env.DB.prepare('SELECT id, article_id, author, body, created_at, updated_at FROM comments ORDER BY created_at ASC LIMIT 1000').all(),
      env.DB.prepare('SELECT article_id, cat_code, updated_by, updated_at FROM article_overrides').all(),
      env.DB.prepare(`
        SELECT ca.id, ca.url, ca.title, ca.summary, ca.cat_code, ca.competitor_id, ca.author, ca.created_at,
          ao.cat_code AS saved_cat_code, ao.updated_by AS classification_updated_by, ao.updated_at AS classification_updated_at
        FROM custom_articles ca
        LEFT JOIN article_overrides ao ON ao.article_id=ca.id
        ORDER BY ca.created_at DESC LIMIT 300
      `).all(),
      env.DB.prepare('SELECT article_id, recommendation, archived, snapshot_json, updated_by, updated_at, archived_by, archived_at FROM article_engagement ORDER BY updated_at DESC LIMIT 2000').all(),
      env.DB.prepare(`
        SELECT article_id, COUNT(*) AS vote_count,
          MAX(CASE WHEN voter=? THEN 1 ELSE 0 END) AS voted_by_me
        FROM article_votes GROUP BY article_id
      `).bind(session.display_name).all(),
      env.DB.prepare('SELECT article_id, generated_at, updated_by, updated_at FROM article_ai_summaries ORDER BY generated_at DESC LIMIT 1000').all(),
      env.DB.prepare('SELECT MAX(fetched_at) AS revision FROM feed_cache').first(),
    ]);
    return json(request, {
      comments: comments.results || [],
      overrides: overrides.results || [],
      articles: articles.results || [],
      engagements: engagements.results || [],
      votes: votes.results || [],
      aiSummaryVersions: aiSummaryVersions.results || [],
      feedRevision: feedState?.revision || null,
      syncedAt: new Date().toISOString(),
    });
  }

  if (path === '/api/comments' && request.method === 'POST') {
    const body = await readBody(request);
    const articleId = cleanText(body?.articleId, 1800);
    const comment = cleanText(body?.body, 1200);
    if (!articleId || !comment) return json(request, { error: 'Article et commentaire obligatoires.' }, 400);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await env.DB.prepare('INSERT INTO comments(id, article_id, author, body, created_at) VALUES(?,?,?,?,?)')
      .bind(id, articleId, session.display_name, comment, createdAt).run();
    return json(request, { comment: { id, article_id: articleId, author: session.display_name, body: comment, created_at: createdAt } }, 201);
  }

  const commentMatch = path.match(/^\/api\/comments\/([^/]+)$/);
  if (commentMatch && (request.method === 'PUT' || request.method === 'DELETE')) {
    const commentId = cleanText(decodeURIComponent(commentMatch[1]), 80);
    const existing = await env.DB.prepare('SELECT id, article_id, author, body, created_at, updated_at FROM comments WHERE id=?').bind(commentId).first();
    if (!existing) return json(request, { error: 'Commentaire introuvable.' }, 404);
    if (existing.author !== session.display_name) return json(request, { error: 'Vous ne pouvez modifier que vos propres commentaires.' }, 403);
    if (request.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM comments WHERE id=?').bind(commentId).run();
      return json(request, { deleted: true, id: commentId });
    }
    const body = cleanText((await readBody(request))?.body, 1200);
    if (!body) return json(request, { error: 'Le commentaire ne peut pas être vide.' }, 400);
    const updatedAt = new Date().toISOString();
    await env.DB.prepare('UPDATE comments SET body=?, updated_at=? WHERE id=?').bind(body, updatedAt, commentId).run();
    return json(request, { comment: { ...existing, body, updated_at: updatedAt } });
  }

  const classificationMatch = path.match(/^\/api\/articles\/(.+)\/classification$/);
  if (classificationMatch && (request.method === 'PUT' || request.method === 'DELETE')) {
    const articleId = cleanText(decodeURIComponent(classificationMatch[1]), 1800);
    if (!articleId) return json(request, { error: 'Article invalide.' }, 400);
    if (request.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM article_overrides WHERE article_id=?').bind(articleId).run();
      return json(request, { reset: true });
    }
    const body = await readBody(request);
    if (!validCatCode(body?.catCode)) return json(request, { error: 'Classification invalide.' }, 400);
    const updatedAt = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO article_overrides(article_id, cat_code, updated_by, updated_at)
      VALUES(?,?,?,?) ON CONFLICT(article_id) DO UPDATE SET
      cat_code=excluded.cat_code, risk_id=NULL, updated_by=excluded.updated_by, updated_at=excluded.updated_at
    `).bind(articleId, body.catCode, session.display_name, updatedAt).run();
    return json(request, { override: { article_id: articleId, cat_code: body.catCode, updated_by: session.display_name, updated_at: updatedAt } });
  }

  const engagementMatch = path.match(/^\/api\/articles\/(.+)\/engagement$/);
  if (engagementMatch && request.method === 'PUT') {
    const articleId = cleanText(decodeURIComponent(engagementMatch[1]), 1800);
    if (!articleId) return json(request, { error: 'Article invalide.' }, 400);
    const body = await readBody(request);
    const recommendation = cleanRecommendation(body?.recommendation);
    const archived = body?.archived === true ? 1 : 0;
    const snapshot = cleanArticleSnapshot(body?.snapshot, articleId);
    const updatedAt = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO article_engagement(article_id, recommendation, archived, snapshot_json, updated_by, updated_at, archived_by, archived_at)
      VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(article_id) DO UPDATE SET
      recommendation=excluded.recommendation, archived=excluded.archived,
      snapshot_json=COALESCE(excluded.snapshot_json, article_engagement.snapshot_json),
      updated_by=excluded.updated_by, updated_at=excluded.updated_at,
      archived_by=CASE
        WHEN excluded.archived=0 THEN NULL
        WHEN article_engagement.archived=0 THEN excluded.archived_by
        ELSE article_engagement.archived_by
      END,
      archived_at=CASE
        WHEN excluded.archived=0 THEN NULL
        WHEN article_engagement.archived=0 THEN excluded.archived_at
        ELSE article_engagement.archived_at
      END
    `).bind(
      articleId, recommendation, archived, snapshot ? JSON.stringify(snapshot) : null,
      session.display_name, updatedAt, archived ? session.display_name : null, archived ? updatedAt : null,
    ).run();
    const savedEngagement = await env.DB.prepare(
      'SELECT article_id, recommendation, archived, snapshot_json, updated_by, updated_at, archived_by, archived_at FROM article_engagement WHERE article_id=?',
    ).bind(articleId).first();
    return json(request, { engagement: {
      ...savedEngagement,
    } });
  }

  const voteMatch = path.match(/^\/api\/articles\/(.+)\/vote$/);
  if (voteMatch && ['POST', 'DELETE'].includes(request.method)) {
    const articleId = cleanText(decodeURIComponent(voteMatch[1]), 1800);
    if (!articleId) return json(request, { error: 'Article invalide.' }, 400);
    if (request.method === 'POST') {
      await env.DB.prepare('INSERT OR IGNORE INTO article_votes(article_id, voter, created_at) VALUES(?,?,?)')
        .bind(articleId, session.display_name, new Date().toISOString()).run();
    } else {
      await env.DB.prepare('DELETE FROM article_votes WHERE article_id=? AND voter=?')
        .bind(articleId, session.display_name).run();
    }
    const count = await env.DB.prepare('SELECT COUNT(*) AS total FROM article_votes WHERE article_id=?').bind(articleId).first();
    return json(request, { articleId, voted: request.method === 'POST', voteCount: Number(count?.total || 0) });
  }

  const summaryMatch = path.match(/^\/api\/articles\/(.+)\/ai-summary$/);
  if (summaryMatch && ['GET','POST','PUT'].includes(request.method)) {
    const articleId = cleanText(decodeURIComponent(summaryMatch[1]), 1800);
    if (!articleId) return json(request, { error: 'Article invalide pour le résumé.' }, 400);
    if (request.method === 'GET') {
      const existing = await env.DB.prepare('SELECT bullets_json, source_url, generated_at, updated_by, updated_at FROM article_ai_summaries WHERE article_id=?').bind(articleId).first();
      if (!existing) return json(request, { error: 'Aucun résumé IA enregistré pour cet article.' }, 404);
      try {
        const bullets = JSON.parse(existing.bullets_json);
        if (!Array.isArray(bullets) || bullets.length !== 4) throw new Error('Résumé incomplet');
        return json(request, { summary: {
          article_id: articleId, bullets, source_url: existing.source_url, generated_at: existing.generated_at,
          updated_by: existing.updated_by, updated_at: existing.updated_at,
        } });
      } catch { return json(request, { error: 'Le résumé IA enregistré est incomplet.' }, 500); }
    }
    const body = await readBody(request);
    if (request.method === 'PUT') {
      const bullets = Array.isArray(body?.bullets)
        ? body.bullets.map(value => cleanArticleText(value, 600)).filter(Boolean)
        : [];
      if (bullets.length !== 4) return json(request, { error: 'Le résumé doit contenir exactement quatre points.' }, 400);
      const existing = await env.DB.prepare('SELECT article_id, source_url, generated_at FROM article_ai_summaries WHERE article_id=?').bind(articleId).first();
      if (!existing) return json(request, { error: 'Aucun résumé IA à modifier pour cet article.' }, 404);
      const updatedAt = new Date().toISOString();
      await env.DB.prepare('UPDATE article_ai_summaries SET bullets_json=?, updated_by=?, updated_at=? WHERE article_id=?')
        .bind(JSON.stringify(bullets), session.display_name, updatedAt, articleId).run();
      return json(request, { summary: {
        article_id: articleId, bullets, source_url: existing.source_url, generated_at: existing.generated_at,
        updated_by: session.display_name, updated_at: updatedAt,
      } });
    }
    const customArticle = await env.DB.prepare('SELECT url, title FROM custom_articles WHERE id=?').bind(articleId).first();
    const sourceUrl = cleanText(customArticle?.url || body?.url, 2000);
    const title = cleanArticleText(customArticle?.title || body?.title, 700);
    // Une description saisie par l'équipe est une note éditoriale, jamais une source pour l'IA.
    const description = customArticle ? '' : cleanArticleText(body?.description, 4000);
    if (!articleId || !sourceUrl || !title || !isPublicArticleUrl(sourceUrl)) {
      return json(request, { error: 'Article invalide pour le résumé.' }, 400);
    }
    const cached = await env.DB.prepare('SELECT bullets_json, source_url, generated_at, updated_by, updated_at FROM article_ai_summaries WHERE article_id=?').bind(articleId).first();
    if (cached && cached.source_url === sourceUrl) {
      try {
        const bullets = JSON.parse(cached.bullets_json);
        if (Array.isArray(bullets) && bullets.length === 4) {
          return json(request, { bullets, generatedAt: cached.generated_at, updatedBy:cached.updated_by, updatedAt:cached.updated_at, cached: true });
        }
      } catch {}
    }

    let extracted = '';
    let extractionMethod = 'direct';
    try { extracted = await extractArticleText(sourceUrl); } catch {}
    const readerText = trimReaderArticleText(body?.readerText);
    if (extracted.length < 160 && readerText.length < 160) {
      try {
        const browserText = await extractArticleTextViaBrowser(env, sourceUrl);
        if (browserText.length > extracted.length) {
          extracted = browserText;
          extractionMethod = 'browser-run';
        }
      } catch (error) {
        console.warn('Browser article extraction failed', new URL(sourceUrl).hostname, error?.message || String(error));
      }
    }
    if (extracted.length < 160 && readerText.length >= 160) {
      extracted = readerText;
      extractionMethod = 'public-reader';
    }
    if (customArticle && extracted.length < 160) {
      return json(request, { error: "Le contenu de l’article n’est pas suffisamment accessible pour produire un résumé IA indépendant de la description ajoutée." }, 422);
    }
    const fallback = cleanArticleText(`Titre : ${title}. Description disponible : ${description || 'aucune description fournie par la source.'}`, 5000);
    const sourceText = extracted.length >= (customArticle ? 160 : 300) ? `Titre : ${title}\n\n${extracted}` : fallback;
    if (sourceText.length < 40) return json(request, { error: 'Le contenu de cet article est insuffisant pour produire un résumé fiable.' }, 422);

    try {
      const bullets = await generateArticleSummary(env, sourceText);
      const generatedAt = new Date().toISOString();
      await env.DB.prepare(`
        INSERT INTO article_ai_summaries(article_id, bullets_json, source_url, generated_at)
        VALUES(?,?,?,?) ON CONFLICT(article_id) DO UPDATE SET
        bullets_json=excluded.bullets_json, source_url=excluded.source_url, generated_at=excluded.generated_at,
        updated_by=NULL, updated_at=NULL
      `).bind(articleId, JSON.stringify(bullets), sourceUrl, generatedAt).run();
      return json(request, { bullets, generatedAt, cached: false, extractionMethod });
    } catch (error) {
      console.error('AI summary failed', articleId, error);
      const localDebug = ['127.0.0.1', 'localhost'].includes(new URL(request.url).hostname)
        ? ` (${error?.message || String(error)})`
        : '';
      return json(request, { error: `Le résumé par IA est momentanément indisponible. La description disponible reste affichée.${localDebug}` }, 503);
    }
  }

  const articleMatch = path.match(/^\/api\/articles\/([^/]+)$/);
  if (articleMatch && (request.method === 'PUT' || request.method === 'DELETE')) {
    const articleId = cleanText(decodeURIComponent(articleMatch[1]), 1800);
    const article = await env.DB.prepare('SELECT id, url, title, summary, cat_code, competitor_id, author, created_at FROM custom_articles WHERE id=?').bind(articleId).first();
    if (!article) return json(request, { error: 'Article introuvable.' }, 404);
    if (request.method === 'PUT') {
      if (article.author !== session.display_name) return json(request, { error: 'Vous ne pouvez modifier que les articles que vous avez ajoutés.' }, 403);
      const summary = cleanText((await readBody(request))?.summary, 3000);
      await env.DB.prepare('UPDATE custom_articles SET summary=? WHERE id=?').bind(summary || null, articleId).run();
      return json(request, { article: { ...article, summary } });
    }
    await env.DB.batch([
      env.DB.prepare('DELETE FROM comments WHERE article_id=?').bind(articleId),
      env.DB.prepare('DELETE FROM article_overrides WHERE article_id=?').bind(articleId),
      env.DB.prepare('DELETE FROM article_engagement WHERE article_id=?').bind(articleId),
      env.DB.prepare('DELETE FROM article_votes WHERE article_id=?').bind(articleId),
      env.DB.prepare('DELETE FROM article_ai_summaries WHERE article_id=?').bind(articleId),
      env.DB.prepare('DELETE FROM custom_articles WHERE id=?').bind(articleId),
    ]);
    return json(request, { deleted:true, id:articleId });
  }

  if (path === '/api/articles' && request.method === 'POST') {
    const body = await readBody(request);
    const articleUrl = cleanText(body?.url, 2000);
    const title = cleanText(body?.title, 700);
    const comment = cleanText(body?.comment, 1200);
    const competitorId = cleanText(body?.competitorId, 80);
    const isCompetitorArticle = validCompetitorId(competitorId);
    const recommendation = cleanRecommendation(body?.recommendation);
    const archived = body?.archived === true ? 1 : 0;
    if (!articleUrl || !title) return json(request, { error: 'Titre et URL sont obligatoires.' }, 400);
    if (competitorId && !isCompetitorArticle) return json(request, { error: 'Enseigne invalide.' }, 400);
    if (!isCompetitorArticle && !validCatCode(body?.catCode)) return json(request, { error: 'Catégorie de risques invalide.' }, 400);
    try { new URL(articleUrl); } catch { return json(request, { error: 'URL invalide.' }, 400); }
    const id = `custom:${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    try {
      const statements = [
        env.DB.prepare('INSERT INTO custom_articles(id,url,title,summary,cat_code,competitor_id,author,created_at) VALUES(?,?,?,?,?,?,?,?)')
          .bind(id, articleUrl, title, null, isCompetitorArticle ? 'A' : body.catCode, isCompetitorArticle ? competitorId : null, session.display_name, createdAt),
      ];
      const snapshot = cleanArticleSnapshot({
        title, link: articleUrl, desc: '', date: createdAt, source: `Ajouté par ${session.display_name}`,
        sourceId: 'shared', catCode: isCompetitorArticle ? 'A' : body.catCode, pays: 'MONDE', lang: 'fr',
        custom: true, shared: true, addedBy: session.display_name, competitorId: isCompetitorArticle ? competitorId : null,
      }, id);
      statements.push(env.DB.prepare('INSERT INTO article_engagement(article_id,recommendation,archived,snapshot_json,updated_by,updated_at,archived_by,archived_at) VALUES(?,?,?,?,?,?,?,?)')
        .bind(id, recommendation, archived, JSON.stringify(snapshot), session.display_name, createdAt, archived ? session.display_name : null, archived ? createdAt : null));
      if (comment) {
        statements.push(env.DB.prepare('INSERT INTO comments(id,article_id,author,body,created_at) VALUES(?,?,?,?,?)')
          .bind(crypto.randomUUID(), id, session.display_name, comment, createdAt));
      }
      await env.DB.batch(statements);
    } catch (error) {
      if (String(error).includes('UNIQUE')) return json(request, { error: 'Cet article a déjà été ajouté.' }, 409);
      throw error;
    }
    return json(request, {
      article: { id, url: articleUrl, title, summary: null, cat_code: isCompetitorArticle ? 'A' : body.catCode, competitor_id: isCompetitorArticle ? competitorId : null, author: session.display_name, created_at: createdAt },
      engagement: {
        article_id:id, recommendation, archived, updated_by:session.display_name, updated_at:createdAt,
        archived_by:archived ? session.display_name : null, archived_at:archived ? createdAt : null,
      },
    }, 201);
  }

  return json(request, { error: 'Route inconnue.' }, 404);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path.startsWith('/api/')) {
      try { return await handleApi(request, env, ctx); }
      catch (error) {
        console.error(error);
        return json(request, { error: 'Erreur interne RiskVeille.' }, 500);
      }
    }
    const asset = await env.ASSETS.fetch(request);
    if (request.method === 'GET' && (path === '/' || path === '/index.html')) {
      const headers = new Headers(asset.headers);
      headers.set('Cache-Control', 'no-store, max-age=0');
      return new Response(asset.body, { status:asset.status, statusText:asset.statusText, headers });
    }
    return asset;
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(refreshBatch(env));
  },
};
