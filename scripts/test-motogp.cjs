// MotoGP: officiële sessietijden uit data/motogp.json, vaste kalender als vangnet.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const root = require('node:path').resolve(__dirname, '..');
const { normalize, parseDate } = require('./update-motogp.cjs');
const releaseVersion = fs.readFileSync(`${root}/release-notes.js`, 'utf8').match(/version: '([0-9.]+)'/)[1];
const wait = ms => new Promise(r => setTimeout(r, ms));

// 1. Normalisatie: alleen MotoGP-klasse, alleen echte sessies, Nederlandse tijd.
assert.equal(parseDate('2026-11-06T14:45:00+0300').toISOString(), '2026-11-06T11:45:00.000Z');
const sessions = normalize([
  { id: 'qat', kind: 'GP', name: 'QATAR AIRWAYS GRAND PRIX OF QATAR ', additional_name: 'QATAR', date_start: '2026-11-06T08:00:00+03:00', circuit: { name: 'Lusail International Circuit' }, broadcasts: [
    { category: { acronym: 'MGP' }, shortname: 'FP1', date_start: '2026-11-06T14:45:00+0300', date_end: '2026-11-06T15:30:00+0300' },
    { category: { acronym: 'MGP' }, shortname: 'SHOW', date_start: '2026-11-05T19:30:00+0300' },
    { category: { acronym: 'MGP' }, shortname: 'WUP', date_start: '2026-11-08T14:40:00+0300' },
    { category: { acronym: 'MT2' }, shortname: 'RAC', date_start: '2026-11-08T17:15:00+0300' },
    { category: { acronym: 'MGP' }, shortname: 'RAC', date_start: '2026-11-08T19:00:00+0300', date_end: '2026-11-08T19:00:00+0300' }
  ] },
  { id: 'test', kind: 'TEST', broadcasts: [{ category: { acronym: 'MGP' }, shortname: 'FP1', date_start: '2026-11-10T10:00:00+0100' }], date_start: '2026-11-10T10:00:00+01:00' }
]);
assert.equal(sessions.map(s => `${s.date} ${s.time} ${s.label}`).join(' | '), '2026-11-06 12:45 Vrije training 1 | 2026-11-08 17:00 Race');
assert.equal(sessions[0].eventStart, '2026-11-06');
assert.equal(sessions[1].end, null, 'race zonder echte eindtijd');

// 2. App: officiële tijden vervangen de TBD-sessies van dezelfde GP; andere GP's houden de kalender.
const day = offset => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString('en-CA'); };
const eventStart = day(1);
const snapshot = { schema: 1, sessions: [{ id: 'x-FP1', eventId: 'x', eventStart, eventName: 'TEST GP', country: 'QATAR', circuit: 'Lusail', session: 'FP1', label: 'Vrije training 1', date: eventStart, time: '12:45', utc: new Date(`${eventStart}T12:45:00`).toISOString(), end: null }] };

class Local extends ResourceLoader {
  fetch(url) {
    const file = new URL(url).pathname.split('/').pop();
    if (/\.(js|css)$/.test(file) && fs.existsSync(`${root}/${file}`)) return Promise.resolve(fs.readFileSync(`${root}/${file}`));
    return null;
  }
}
function createApp(motogpOk, stored = null) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', e => errors.push(e.message));
  const dom = new JSDOM(fs.readFileSync(`${root}/index.html`, 'utf8'), {
    url: 'https://test.sport.local/', runScripts: 'dangerously', resources: new Local(), pretendToBeVisual: true, virtualConsole,
    beforeParse(window) {
      window.scrollTo = () => {};
      window.HTMLElement.prototype.scrollIntoView = function () {};
      window.IntersectionObserver = class { observe() {} disconnect() {} };
      window.localStorage.setItem('sportOpTvSeenRelease', releaseVersion);
      if (stored) window.localStorage.setItem('motogpSessionsSnapshot', JSON.stringify(stored));
      window.fetch = async url => {
        if (String(url).includes('data/motogp.json')) return motogpOk ? { ok: true, status: 200, json: async () => snapshot } : { ok: false, status: 404, json: async () => ({}) };
        return { ok: true, status: 200, json: async () => ({ events: [], matches: [], data: [], items: [] }) };
      };
    }
  });
  return { dom, errors };
}

(async () => {
  let { dom, errors } = createApp(true);
  let w = dom.window;
  await new Promise(r => w.addEventListener('load', r));
  await wait(200);
  // Zet een kalender-GP op dezelfde startdatum, zodat de vervanging te zien is.
  w.eval(`motoGPCalendar.push({ date: '${eventStart}', time: '12:00', event: 'GP Test - Testcircuit', location: 'Testcircuit', channel: 'Ziggo Sport' })`);
  w.document.querySelector('.sport-filter-btn[data-sport="motogp"]').click();
  await wait(600);
  const events = w.eval('cachedData.motogp').filter(e => e.title.startsWith('GP Test'));
  assert.equal(events.length, 1, 'TBD-sessies van deze GP vervangen door de officiële sessie');
  assert.equal(events[0].time, '12:45');
  assert.equal(events[0].title, 'GP Test - Testcircuit - Vrije training 1');
  assert.match(w.document.body.textContent, /12:45/);
  assert.equal(JSON.parse(w.localStorage.getItem('motogpSessionsSnapshot')).length, 1);
  assert.deepEqual(errors, []);
  w.close();

  // 3. Databestand onbereikbaar: bewaard schema; zonder bewaard schema de vaste kalender.
  ({ dom, errors } = createApp(false, snapshot.sessions));
  w = dom.window;
  await new Promise(r => w.addEventListener('load', r));
  await wait(200);
  await w.eval('fetchMotoGPSessions()');
  assert.equal(w.eval('cachedData.motogpSessions.length'), 1, 'bewaard schema gebruikt');
  w.close();
  ({ dom, errors } = createApp(false));
  w = dom.window;
  await new Promise(r => w.addEventListener('load', r));
  await wait(200);
  await w.eval('fetchMotoGPSessions()');
  assert.ok(w.eval('getMotoGPEvents()').every(e => e.source === 'MotoGP confirmed calendar'), 'zonder data: vaste kalender');
  w.close();
  console.log('MotoGP: officiële tijden (alleen MotoGP-klasse, NL-tijd), vervanging per GP, bewaard schema en kalender als vangnet; geslaagd.');
})().catch(e => { console.error(e); process.exit(1); });
