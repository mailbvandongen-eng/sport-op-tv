// Op welk podium (Main Stage / Stage Two) een PDC-partij gespeeld wordt. De
// fixtures-feed zet overal "Board 1"; de officiële speelschema's staan alleen in
// het PDC-nieuws. Bij een fout blijft de vorige snapshot staan.
const fs = require('node:fs');
const path = require('node:path');
const NEWS_URL = 'https://news.cms.web.gc.pdcservices.co.uk';
const OUTPUT = path.join(__dirname, '../data/darts-stages.json');
const LOOKBACK_DAYS = 10;
const KEEP_PAST_DAYS = 7;
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function decode(text = '') {
  const named = { amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>', rsquo: '’', lsquo: '‘', ndash: '–' };
  return String(text)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => named[name] ?? m);
}

function htmlToLines(html = '') {
  return decode(String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h\d|tr)>/gi, '\n')
    .replace(/<[^>]*>/g, ''))
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function stageOf(line) {
  const text = line.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  if (/^(main stage|stage one|stage 1|board one|board 1)$/.test(text)) return 'Main Stage';
  if (/^(stage two|stage 2|second stage|board two|board 2)$/.test(text)) return 'Stage Two';
  return '';
}

function dateOf(line, year) {
  const text = line.toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, '$1');
  const match = text.match(/^(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(?:(\d{1,2})\s+([a-z]+)|([a-z]+)\s+(\d{1,2}))$/);
  if (!match) return '';
  const day = Number(match[1] || match[4]);
  const month = MONTHS.indexOf(match[2] || match[3]);
  if (month < 0 || day < 1 || day > 31) return '';
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// "Speler A v Speler B" (schema) of "Speler A 6-3 Speler B" (uitslag in een live-artikel).
function matchOf(line) {
  const match = line.match(/^([^\d]+?)\s+v\s+([^\d]+)$/) || line.match(/^([^\d]+?)\s+\d{1,2}\s*-\s*\d{1,2}\s+([^\d]+)$/);
  if (!match) return null;
  const [home, away] = [match[1], match[2]].map(name => name.replace(/\s*\([^)]*\)\s*$/, '').trim());
  if (home.split(' ').length > 5 || away.split(' ').length > 5) return null;
  return { home, away };
}

function parseArticle(article) {
  const year = String(article.publishedDateTime || '').slice(0, 4);
  const html = (article.content || []).map(row => row?.rowData?.widgetData?.content || '').join('\n');
  const byDate = new Map();
  let date = '';
  let stage = '';
  let session = '';
  for (const line of htmlToLines(html)) {
    const nextDate = dateOf(line, year);
    if (nextDate) { date = nextDate; stage = ''; session = ''; continue; }
    const nextStage = stageOf(line);
    if (nextStage) { stage = nextStage; continue; }
    if (/session/i.test(line)) {
      stage = '';
      session = /morning/i.test(line) ? 'morning' : /afternoon/i.test(line) ? 'afternoon' : /evening/i.test(line) ? 'evening' : '';
      continue;
    }
    const match = date && stage && matchOf(line);
    if (!match) continue;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push({ ...match, stage, ...(session ? { session } : {}) });
  }
  return byDate;
}

async function getJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'sport-op-tv (github.com/mailbvandongen-eng/sport-op-tv)' } });
  if (!response.ok) throw new Error(`${url} gaf HTTP ${response.status}`);
  return response.json();
}

async function main() {
  const search = await getJson(`${NEWS_URL}/v2/search?page.size=60&sort=publishedDateTime%3Adesc`);
  const since = Date.now() - LOOKBACK_DAYS * 86400000;
  const posts = (search.data || [])
    .map(item => item.attributes || item)
    .filter(post => post.postSlug && Date.parse(post.publishedDateTime) >= since)
    .filter(post => (post.tagsData?.eventsTags || []).length)
    .sort((a, b) => Date.parse(a.publishedDateTime) - Date.parse(b.publishedDateTime));

  const previous = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, 'utf8')) : { days: {} };
  const keepFrom = new Date(Date.now() - KEEP_PAST_DAYS * 86400000).toISOString().slice(0, 10);
  const days = Object.fromEntries(Object.entries(previous.days || {}).filter(([date]) => date >= keepFrom));

  // Oudste eerst: een later artikel gaat voor bij de partijen die het noemt
  // (live-artikelen verplaatsen soms een partij naar het andere podium).
  const pairKey = match => [match.home, match.away].map(name => name.toLowerCase()).sort().join('|');
  for (const post of posts) {
    const slug = post.postSlug.replace(/\/$/, '');
    const article = (await getJson(`${NEWS_URL}/v1/byslug?postSlug=${encodeURIComponent(slug)}`)).body?.[0];
    if (!article) continue;
    for (const [date, matches] of parseArticle(article)) {
      const merged = new Map((days[date]?.matches || []).map(match => [pairKey(match), match]));
      matches.forEach(match => merged.set(pairKey(match), match));
      days[date] = { source: `https://www.pdc.tv${slug}/`, matches: [...merged.values()] };
    }
  }

  const output = { schema: 1, fetchedAt: new Date().toISOString(), days: Object.fromEntries(Object.entries(days).sort()) };
  fs.writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
  const counts = Object.entries(output.days).map(([date, day]) => `${date}: ${day.matches.length}`).join(', ');
  console.log(`Podiumindeling bijgewerkt (${counts || 'geen schema'})`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(`Podiumindeling niet bijgewerkt: ${error.message}`);
    process.exit(fs.existsSync(OUTPUT) ? 0 : 1);
  });
}

module.exports = { parseArticle, htmlToLines };
