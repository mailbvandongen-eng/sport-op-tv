// Officiële MotoGP-sessietijden (premier class) uit de MotoGP-kalender-API.
// De API staat geen browserverzoeken toe (CORS), dus de workflow schrijft data/motogp.json.
// Bij een fout blijft de vorige snapshot staan.
const fs = require('node:fs');
const path = require('node:path');
const API = 'https://api.motogp.pulselive.com/motogp/v1/events';
const OUTPUT = path.join(__dirname, '../data/motogp.json');
const SESSION_LABELS = {
  FP1: 'Vrije training 1',
  PR: 'Practice',
  FP2: 'Vrije training 2',
  Q1: 'Kwalificatie 1',
  Q2: 'Kwalificatie 2',
  SPR: 'Sprint',
  RAC: 'Race'
};

function amsterdamParts(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

// "+0300" is geen geldige ISO-offset voor Date; maak er "+03:00" van.
function parseDate(value = '') {
  const date = new Date(String(value).replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalize(events = []) {
  const sessions = [];
  for (const event of events) {
    if (event?.kind !== 'GP' || event.show_in_calendar === false) continue;
    const eventStart = parseDate(event.date_start);
    if (!eventStart) continue;
    for (const broadcast of event.broadcasts || []) {
      if (broadcast?.category?.acronym !== 'MGP') continue;
      const label = SESSION_LABELS[broadcast.shortname];
      const start = parseDate(broadcast.date_start);
      if (!label || !start) continue;
      const end = parseDate(broadcast.date_end);
      const local = amsterdamParts(start);
      sessions.push({
        id: `${event.id}-${broadcast.shortname}`,
        eventId: event.id,
        eventStart: amsterdamParts(eventStart).date,
        eventName: String(event.name || '').trim(),
        country: event.additional_name || event.country || '',
        circuit: event.circuit?.name || '',
        session: broadcast.shortname,
        label,
        date: local.date,
        time: local.time,
        utc: start.toISOString(),
        end: end && end > start ? end.toISOString() : null
      });
    }
  }
  return sessions.sort((a, b) => a.utc.localeCompare(b.utc));
}

async function collect(year = new Date().getFullYear()) {
  const all = [];
  for (const seasonYear of [year, year + 1]) {
    const response = await fetch(`${API}?seasonYear=${seasonYear}`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error(`MotoGP HTTP ${response.status}`);
    const events = await response.json();
    if (!Array.isArray(events)) throw Error('Onverwacht MotoGP-antwoord');
    all.push(...normalize(events));
  }
  if (!all.some(session => session.date.startsWith(String(year)))) throw Error('Geen MotoGP-sessies voor dit seizoen');
  return { schema: 1, sourceUrl: API, fetchedAt: new Date().toISOString(), sessions: all };
}

module.exports = { normalize, parseDate, collect };

if (require.main === module) {
  collect()
    .then(data => fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2) + '\n'))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
