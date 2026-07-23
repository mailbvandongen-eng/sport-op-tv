import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_PATH = resolve(ROOT_DIR, 'index.html');
const AMSTERDAM_TIME_ZONE = 'Europe/Amsterdam';
const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const DEFAULT_DAYS_FORWARD = 30;

function getDatePartsInTimeZone(dateObj, timeZone = AMSTERDAM_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(dateObj).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});

  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    espnKey: `${parts.year}${parts.month}${parts.day}`
  };
}

function addDaysToDateKey(dateKey, days) {
  const [year, month, day] = String(dateKey || '').split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return getDatePartsInTimeZone(date).dateKey;
}

function toEspnDateKey(dateKey) {
  return String(dateKey || '').replace(/-/g, '');
}

function getCheckDateKey() {
  const configuredDate = String(process.env.CHECK_DATE || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(configuredDate)) return configuredDate;
  return getDatePartsInTimeZone(new Date()).dateKey;
}

function extractEspnCompetitions(html) {
  const match = html.match(/ESPN_COMPETITIONS:\s*\[([\s\S]*?)\r?\n\s*\],\r?\n\r?\n\s*\/\/ Backup:/);
  if (!match) throw new Error('ESPN_COMPETITIONS kon niet uit index.html worden gelezen');

  const entries = [...match[1].matchAll(/\{\s*slug:\s*'([^']+)',\s*name:\s*'([^']+)'([^}]*)\}/g)]
    .map(([, slug, name, rest]) => ({
      slug,
      name,
      dutchClubsOnly: /dutchClubsOnly:\s*true/.test(rest),
      dutchNationalTeamOnly: /dutchNationalTeamOnly:\s*true/.test(rest)
    }));

  if (entries.length === 0) throw new Error('Geen ESPN-competities gevonden in index.html');
  return entries;
}

async function fetchScoreboard(slug, fromDateKey, toDateKey) {
  const url = `${ESPN_BASE_URL}/${slug}/scoreboard?dates=${toEspnDateKey(fromDateKey)}-${toEspnDateKey(toDateKey)}&limit=1000`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'sport-op-tv-football-check/1.0'
    }
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  return {
    slug,
    status: response.status,
    ok: response.ok,
    events: Array.isArray(data.events) ? data.events : []
  };
}

function eventText(event = {}) {
  const competitors = event.competitions?.[0]?.competitors || [];
  const names = competitors
    .map(competitor => [
      competitor.team?.displayName,
      competitor.team?.shortDisplayName,
      competitor.team?.name
    ].filter(Boolean).join(' / '))
    .filter(Boolean)
    .join(' | ');

  return [event.name, event.shortName, names].filter(Boolean).join(' | ');
}

function findMatchingEvents(events, patterns) {
  return events.filter(event => {
    const text = eventText(event);
    return patterns.every(pattern => pattern.test(text));
  });
}

function describeEvent(event) {
  const date = new Date(event.date);
  const dateLabel = Number.isNaN(date.getTime())
    ? 'TBD'
    : date.toLocaleString('nl-NL', {
      timeZone: AMSTERDAM_TIME_ZONE,
      dateStyle: 'short',
      timeStyle: 'short'
    });
  return `${dateLabel} - ${event.name || event.shortName || 'wedstrijd'}`;
}

async function runControlCheck(check) {
  const result = await fetchScoreboard(check.slug, check.from, check.to);
  if (!result.ok) {
    return {
      ok: false,
      message: `${check.label}: ESPN ${check.slug} geeft status ${result.status}`
    };
  }

  const matches = findMatchingEvents(result.events, check.patterns);
  if (matches.length < check.minMatches) {
    return {
      ok: false,
      message: `${check.label}: verwacht minimaal ${check.minMatches}, gevonden ${matches.length}`
    };
  }

  return {
    ok: true,
    message: `${check.label}: ${matches.length} gevonden`,
    matches
  };
}

async function main() {
  const html = await readFile(INDEX_PATH, 'utf8');
  const competitions = extractEspnCompetitions(html);
  const checkDateKey = getCheckDateKey();
  const toDateKey = addDaysToDateKey(checkDateKey, Number(process.env.DAYS_FORWARD || DEFAULT_DAYS_FORWARD));
  const failures = [];

  const duplicateSlugs = competitions
    .map(comp => comp.slug)
    .filter((slug, index, all) => all.indexOf(slug) !== index);
  if (duplicateSlugs.length > 0) {
    failures.push(`Dubbele ESPN-slugs in index.html: ${[...new Set(duplicateSlugs)].join(', ')}`);
  }

  console.log(`Football source check (${AMSTERDAM_TIME_ZONE})`);
  console.log(`Actueel venster: ${checkDateKey} t/m ${toDateKey}`);
  console.log(`ESPN-competities in app: ${competitions.length}`);

  const currentResults = [];
  for (const comp of competitions) {
    const result = await fetchScoreboard(comp.slug, checkDateKey, toDateKey);
    currentResults.push({ comp, result });
    console.log(`${comp.name} | ${comp.slug} | status ${result.status} | events ${result.events.length}`);
    if (!result.ok) {
      failures.push(`${comp.name} (${comp.slug}) geeft ESPN status ${result.status}`);
    }
  }

  const controlChecks = [
    {
      label: 'Ajax Conference League kwalificatie 2026',
      slug: 'uefa.europa.conf_qual',
      from: '2026-07-23',
      to: '2026-07-30',
      minMatches: 2,
      patterns: [/ajax/i, /vojvodina/i]
    },
    {
      label: 'FC Twente Europa League kwalificatie 2026',
      slug: 'uefa.europa_qual',
      from: '2026-07-23',
      to: '2026-07-30',
      minMatches: 2,
      patterns: [/twente/i, /ferencvaros/i]
    },
    {
      label: 'Oranje Leeuwinnen WK kwalificatie 2026',
      slug: 'fifa.wworldq.uefa',
      from: '2026-10-09',
      to: '2026-10-13',
      minMatches: 2,
      patterns: [/netherlands|nederland/i, /hungary|hongarije/i]
    },
    {
      label: 'Nederlands elftal Nations League 2026',
      slug: 'uefa.nations',
      from: '2026-09-24',
      to: '2026-11-16',
      minMatches: 4,
      patterns: [/netherlands|nederland/i]
    }
  ];

  console.log('Regressiechecks:');
  for (const check of controlChecks) {
    const result = await runControlCheck(check);
    console.log(result.message);
    if (result.matches?.length) {
      result.matches.slice(0, 4).forEach(match => console.log(`  - ${describeEvent(match)}`));
    }
    if (!result.ok) failures.push(result.message);
  }

  const interestingCurrent = currentResults.flatMap(({ comp, result }) => {
    return result.events
      .filter(event => /ajax|twente|psv|feyenoord|az|utrecht|go ahead|netherlands|nederland/i.test(eventText(event)))
      .map(event => `${comp.name}: ${describeEvent(event)}`);
  });

  console.log('Nederlandse relevante wedstrijden in actueel venster:');
  if (interestingCurrent.length === 0) {
    console.log('  Geen relevante Nederlandse wedstrijden gepubliceerd in dit venster.');
  } else {
    interestingCurrent.slice(0, 20).forEach(line => console.log(`  - ${line}`));
  }

  if (failures.length > 0) {
    console.error(`Football source check FAILED:\n${failures.join('\n')}`);
    process.exitCode = 1;
    return;
  }

  console.log('Football source check OK');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
