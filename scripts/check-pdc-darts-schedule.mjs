import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_PATH = resolve(ROOT_DIR, 'index.html');
const AMSTERDAM_TIME_ZONE = 'Europe/Amsterdam';
const DAYS_FORWARD = 30;
const SCORE_TEXT_PATTERN = /(?:^|\s)\d{1,2}\s*[-\u2013]\s*\d{1,2}(?:\s|$)/;

function cleanDartsTournamentName(name = '') {
  return String(name || '')
    .replace(/^20\d{2}\s+/i, '')
    .replace(/^ET\d+\s*-\s*/i, '')
    .replace(/\s*-\s*Finale$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeResultText(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeDartsTournamentName(name = '') {
  return normalizeResultText(cleanDartsTournamentName(name));
}

function extractPdcFixturesUrl(html) {
  const match = html.match(/PDC_FIXTURES_URL:\s*'([^']+)'/);
  if (!match) throw new Error('PDC_FIXTURES_URL ontbreekt in index.html');
  return match[1];
}

function extractDartsCalendarBlock(html) {
  const marker = 'const dartsCalendar = [';
  const start = html.indexOf(marker);
  if (start === -1) throw new Error('dartsCalendar ontbreekt in index.html');

  const end = html.indexOf('\n        ];', start + marker.length);
  if (end === -1) throw new Error('dartsCalendar kon niet betrouwbaar worden uitgelezen');
  return html.slice(start + marker.length, end);
}

function extractConfiguredDartsTournamentNames(html) {
  const block = extractDartsCalendarBlock(html);
  const names = [...block.matchAll(/event:\s*'([^']+)'/g)]
    .map(([, name]) => normalizeDartsTournamentName(name))
    .filter(Boolean);

  const uniqueNames = new Set(names);
  if (uniqueNames.size === 0) throw new Error('Geen dartstoernooien gevonden in dartsCalendar');
  return uniqueNames;
}

function isConfiguredDartsTournament(name = '', configuredNames) {
  const normalized = normalizeDartsTournamentName(name);
  if (!normalized) return false;

  for (const configured of configuredNames) {
    if (normalized === configured || normalized.endsWith(configured)) return true;
  }
  return false;
}

function getPdcParticipantName(participant = {}) {
  const fullName = [participant.firstName, participant.lastName]
    .map(part => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
  return fullName || String(participant.nickname || '').trim();
}

function getPdcFixtureDate(attributes = {}) {
  if (!attributes.startDate) return new Date(Number.NaN);
  if (attributes.startTime) return new Date(`${attributes.startDate}T${attributes.startTime}Z`);
  return new Date(`${attributes.startDate}T12:00:00`);
}

function getDatePartsInTimeZone(dateObj, timeZone = AMSTERDAM_TIME_ZONE) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) {
    return { dateKey: '', time: '' };
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(dateObj).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});

  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`
  };
}

function getPdcFixtureLocalParts(attributes = {}) {
  return getDatePartsInTimeZone(getPdcFixtureDate(attributes));
}

function addDaysToDateKey(dateKey, days) {
  const [year, month, day] = String(dateKey || '').split('-').map(Number);
  if (!year || !month || !day) return '';
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function getCheckDateKey() {
  const configuredDate = String(process.env.CHECK_DATE || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(configuredDate)) return configuredDate;
  return getDatePartsInTimeZone(new Date()).dateKey;
}

function getDartsSessionStartTime(localTime = '') {
  const hour = parseInt(String(localTime || '').split(':')[0], 10);
  if (Number.isNaN(hour)) return localTime || 'TBD';
  return `${String(hour).padStart(2, '0')}:00`;
}

function getDartsSessionLabel(localTime = '') {
  const hour = parseInt(String(localTime || '').split(':')[0], 10);
  if (Number.isNaN(hour)) return 'Sessie';
  if (hour < 12) return 'Ochtendsessie';
  if (hour < 17) return 'Middagsessie';
  return 'Avondsessie';
}

function getDartsStageLabel(stageName = '') {
  const normalized = String(stageName || '').trim().toLowerCase();
  const labels = {
    'last 64': 'Laatste 64',
    'last 32': 'Laatste 32',
    'last 16': 'Laatste 16',
    'quarter-final': 'Kwartfinales',
    'quarter-finals': 'Kwartfinales',
    'semi-final': 'Halve finales',
    'semi-finals': 'Halve finales',
    'final': 'Finale'
  };
  return labels[normalized] || stageName || '';
}

function getPdcMatchPlayers(attributes = {}) {
  const nameParts = String(attributes.name || '').split(/\s+vs\s+/i);
  const pdcHome = getPdcParticipantName(attributes.participant1);
  const pdcAway = getPdcParticipantName(attributes.participant2);
  const namedHome = nameParts[0] && !/^N\/A$/i.test(nameParts[0].trim()) ? nameParts[0].trim() : '';
  const namedAway = nameParts[1] && !/^N\/A$/i.test(nameParts[1].trim()) ? nameParts[1].trim() : '';
  return {
    home: pdcHome || namedHome,
    away: pdcAway || namedAway
  };
}

function formatPdcScheduleItem(attributes = {}) {
  const localTime = getPdcFixtureLocalParts(attributes).time;
  const { home, away } = getPdcMatchPlayers(attributes);
  const stage = getDartsStageLabel(attributes.stage?.name || '');
  let matchLabel = '';

  if (home && away) {
    matchLabel = `${home} vs ${away}`;
  } else if (home || away) {
    matchLabel = `${home || away} vs tegenstander volgt`;
  } else {
    matchLabel = `${stage || 'Wedstrijd'} - spelers volgen zodra PDC ze publiceert`;
  }

  return localTime ? `${localTime} - ${matchLabel}` : matchLabel;
}

function buildLocationLabel(...parts) {
  const seen = new Set();
  return parts
    .map(part => String(part || '').trim())
    .filter(Boolean)
    .filter(part => {
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(', ');
}

function normalizePdcDartsSchedule(fixtures, configuredNames, checkDateKey) {
  const fromDateKey = checkDateKey;
  const toDateKey = addDaysToDateKey(checkDateKey, DAYS_FORWARD);
  const sessionGroups = new Map();
  let matchedFixtureCount = 0;

  fixtures
    .map(fixture => fixture.attributes || fixture)
    .filter(attributes => attributes && isConfiguredDartsTournament(attributes.tournament?.name || '', configuredNames))
    .forEach(attributes => {
      const dateObj = getPdcFixtureDate(attributes);
      if (Number.isNaN(dateObj.getTime())) return;

      const localParts = getPdcFixtureLocalParts(attributes);
      const localDateKey = localParts.dateKey;
      const localTime = localParts.time;
      if (!localDateKey || localDateKey < fromDateKey || localDateKey > toDateKey) return;
      matchedFixtureCount += 1;

      const tournamentName = cleanDartsTournamentName(attributes.tournament?.name || 'PDC Darts');
      const sessionStart = getDartsSessionStartTime(localTime);
      const sessionName = getDartsSessionLabel(localTime);
      const sessionKey = [
        localDateKey,
        attributes.tournamentID || tournamentName,
        sessionName
      ].join('|');

      if (!sessionGroups.has(sessionKey)) {
        sessionGroups.set(sessionKey, {
          localDateKey,
          tournamentName,
          tournamentID: attributes.tournamentID || '',
          sessionStart,
          sessionName,
          location: buildLocationLabel(attributes.tournament?.venue, attributes.tournament?.city),
          fixtures: [],
          stages: new Set()
        });
      }

      const group = sessionGroups.get(sessionKey);
      group.sessionStart = [group.sessionStart, sessionStart].sort()[0];
      group.fixtures.push(attributes);
      const stage = getDartsStageLabel(attributes.stage?.name || '');
      if (stage) group.stages.add(stage);
    });

  const eventGroups = new Map();

  Array.from(sessionGroups.values())
    .sort((a, b) => a.localDateKey.localeCompare(b.localDateKey) || a.sessionStart.localeCompare(b.sessionStart))
    .forEach(session => {
      session.fixtures.sort((a, b) => getPdcFixtureDate(a) - getPdcFixtureDate(b));

      const stageLabel = Array.from(session.stages).join(' / ');
      const eventKey = [
        session.localDateKey,
        session.tournamentID || normalizeDartsTournamentName(session.tournamentName)
      ].join('|');

      if (!eventGroups.has(eventKey)) {
        eventGroups.set(eventKey, {
          dateKey: session.localDateKey,
          time: session.sessionStart,
          title: session.tournamentName,
          location: session.location,
          sessions: []
        });
      }

      const event = eventGroups.get(eventKey);
      event.time = [event.time, session.sessionStart].sort()[0];
      event.sessions.push({
        time: session.sessionStart,
        label: [session.sessionName, stageLabel].filter(Boolean).join(' - '),
        items: session.fixtures.map(formatPdcScheduleItem)
      });
    });

  return {
    matchedFixtureCount,
    fromDateKey,
    toDateKey,
    events: Array.from(eventGroups.values())
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.time.localeCompare(b.time))
  };
}

async function fetchPdcFixtures(url) {
  const separator = url.includes('?') ? '&' : '?';
  const response = await fetch(`${url}${separator}v=${Date.now()}`, {
    headers: {
      'User-Agent': 'sport-op-tv-pdc-check/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`PDC fixtures ophalen mislukt: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data?.data)) {
    throw new Error('PDC response bevat geen data-array');
  }
  return data.data;
}

function findScoreLeaks(events) {
  const leaks = [];

  for (const event of events) {
    for (const session of event.sessions) {
      for (const item of session.items) {
        const matchText = item.replace(/^\d{1,2}:\d{2}\s*[-\u2013]\s*/, '');
        if (SCORE_TEXT_PATTERN.test(matchText)) {
          leaks.push(`${event.dateKey} ${event.title}: ${item}`);
        }
      }
    }
  }

  return leaks;
}

function countUnpublishedPlayerItems(events) {
  let count = 0;
  for (const event of events) {
    for (const session of event.sessions) {
      count += session.items.filter(item => /spelers volgen|tegenstander volgt/i.test(item)).length;
    }
  }
  return count;
}

function printEventSummary(label, events) {
  console.log(label);
  if (events.length === 0) {
    console.log('  Geen geconfigureerde PDC-wedstrijden gepubliceerd.');
    return;
  }

  for (const event of events) {
    console.log(`  ${event.dateKey} ${event.time} - ${event.title}${event.location ? ` (${event.location})` : ''}`);
    for (const session of event.sessions) {
      console.log(`    ${session.label}`);
      for (const item of session.items.slice(0, 6)) {
        console.log(`      - ${item}`);
      }
      if (session.items.length > 6) {
        console.log(`      - ... ${session.items.length - 6} meer`);
      }
    }
  }
}

async function main() {
  const html = await readFile(INDEX_PATH, 'utf8');
  const pdcUrl = extractPdcFixturesUrl(html);
  const configuredNames = extractConfiguredDartsTournamentNames(html);
  const checkDateKey = getCheckDateKey();
  const fixtures = await fetchPdcFixtures(pdcUrl);
  const result = normalizePdcDartsSchedule(fixtures, configuredNames, checkDateKey);
  const scoreLeaks = findScoreLeaks(result.events);
  const failures = [];

  if (fixtures.length === 0) {
    failures.push('PDC endpoint gaf nul fixtures terug.');
  }
  if (result.matchedFixtureCount > 0 && result.events.length === 0) {
    failures.push('PDC fixtures matchen wel met de app, maar normaliseren naar nul programma-events.');
  }
  if (scoreLeaks.length > 0) {
    failures.push(`Uitslagen lekken in het gewone dartsprogramma:\n${scoreLeaks.join('\n')}`);
  }

  if (failures.length > 0) {
    console.error(failures.join('\n\n'));
    process.exitCode = 1;
    return;
  }

  const tomorrowKey = addDaysToDateKey(checkDateKey, 1);
  const tomorrowEvents = result.events.filter(event => event.dateKey === tomorrowKey);
  const nextEvent = result.events.find(event => event.dateKey >= checkDateKey);
  const unpublishedPlayerItems = countUnpublishedPlayerItems(result.events);

  console.log(`PDC darts check OK (${AMSTERDAM_TIME_ZONE})`);
  console.log(`Venster: ${result.fromDateKey} t/m ${result.toDateKey}`);
  console.log(`PDC fixtures totaal: ${fixtures.length}`);
  console.log(`Geconfigureerde PDC fixtures in venster: ${result.matchedFixtureCount}`);
  console.log(`Programma-events: ${result.events.length}`);
  console.log(`Spelers nog niet gepubliceerd door PDC: ${unpublishedPlayerItems}`);

  if (nextEvent) {
    console.log(`Eerstvolgende toernooi: ${nextEvent.dateKey} ${nextEvent.time} - ${nextEvent.title}`);
  } else {
    console.log('Eerstvolgende toernooi: geen geconfigureerde PDC fixtures gepubliceerd in dit venster.');
  }

  printEventSummary(`Morgen (${tomorrowKey})`, tomorrowEvents);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
