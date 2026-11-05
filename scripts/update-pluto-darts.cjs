// Darts op Pluto TV buiten de PDC (MODUS Super Series, ADC e.d.), uit de openbare
// streamtabel van dartn.de. Bij een fout blijft de vorige snapshot staan.
const fs = require('node:fs');
const path = require('node:path');
const SOURCE_URL = 'https://www.dartn.de/TV-Termine/';
const OUTPUT = path.join(__dirname, '../data/darts-pluto.json');
const KEEP_PAST_DAYS = 14;

function decode(text = '') {
  const named = { amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>', ndash: '–', mdash: '—', auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', rsquo: '’', lsquo: '‘' };
  return String(text)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => named[name] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function sessionLabel(time) {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return 'Ochtendsessie';
  if (hour < 18) return 'Middagsessie';
  return 'Avondsessie';
}

// Alleen rijen met één exacte datum en starttijd(en); periodes zonder tijd zijn niet betrouwbaar genoeg.
function parseRow(cells) {
  const [when, event, where] = cells;
  if (!/pluto/i.test(where) || /dazn/i.test(where)) return null;
  const date = when.match(/\b(\d{1,2})\.(\d{1,2})\.(20\d{2})\b/);
  if (!date || /\d{1,2}\.\d{1,2}\.(?:20\d{2})?\s*[-–]/.test(when)) return null;
  const times = [...new Set([...when.matchAll(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\s*(?=Uhr|&|und|,|$)/g)]
    .map(([, h, m]) => `${h.padStart(2, '0')}:${m}`))].sort();
  if (!times.length || !event) return null;
  const dateKey = `${date[3]}-${date[2].padStart(2, '0')}-${date[1].padStart(2, '0')}`;
  return {
    id: `${dateKey}-${slug(event)}`,
    date: dateKey,
    time: times[0],
    event,
    channel: 'Pluto TV',
    stream: where,
    sessions: times.map(time => ({ time, label: sessionLabel(time) })),
    source: 'dartn.de'
  };
}

function parse(html) {
  const heading = html.search(/Weitere Streams von\s+Dart-Turnieren/i);
  if (heading === -1) throw Error('Streamtabel dartn.de niet gevonden');
  const table = html.slice(heading).match(/<table[\s\S]*?<\/table>/i)?.[0];
  if (!table) throw Error('Streamtabel dartn.de zonder tabel');
  const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)]
    .map(([row]) => [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(([, cell]) => decode(cell)));
  if (!rows.length || !/datum/i.test(rows[0][0] || '') || !/wo zu/i.test(rows[0][2] || '')) throw Error('Onverwachte kolommen in streamtabel dartn.de');
  const unique = new Map();
  rows.slice(1).filter(cells => cells.length >= 3).map(parseRow).filter(Boolean).forEach(item => unique.set(item.id, item));
  return [...unique.values()];
}

function merge(previous = [], fresh = [], todayKey) {
  const cutoff = new Date(`${todayKey}T12:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - KEEP_PAST_DAYS);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const freshDates = new Set(fresh.map(item => item.date));
  // Oudere dagen verdwijnen van dartn.de; bewaar ze kort zodat "verleden" ze nog toont.
  const kept = previous.filter(item => item.date >= cutoffKey && item.date < todayKey && !freshDates.has(item.date));
  return [...kept, ...fresh.filter(item => item.date >= cutoffKey)]
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.event.localeCompare(b.event));
}

async function collect(previous = []) {
  const response = await fetch(SOURCE_URL, { headers: { 'User-Agent': 'sport-op-tv (github.com/mailbvandongen-eng/sport-op-tv)' }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error('dartn.de HTTP ' + response.status);
  const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());
  return { schema: 1, sourceUrl: SOURCE_URL, fetchedAt: new Date().toISOString(), broadcasts: merge(previous, parse(await response.text()), todayKey) };
}

module.exports = { parse, parseRow, merge, collect };

if (require.main === module) {
  let previous = [];
  try { previous = JSON.parse(fs.readFileSync(OUTPUT, 'utf8')).broadcasts || []; } catch (_) { /* Eerste run. */ }
  collect(previous)
    .then(data => fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2) + '\n'))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
