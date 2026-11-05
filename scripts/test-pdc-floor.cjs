// Players Championships (vloertoernooien, 128 tourkaarthouders) uit de PDC-feed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const root = require('node:path').resolve(__dirname, '..');
const releaseVersion = fs.readFileSync(`${root}/release-notes.js`, 'utf8').match(/version: '([0-9.]+)'/)[1];
const wait = ms => new Promise(r => setTimeout(r, ms));
const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());

const tournament = { tournamentID: '10793', name: '2026 Players Championship 34', venue: 'Mattioli Arena, Leicester', city: 'Leicester', isTelevised: false };
const fixture = (stageID, stage, p1, p2, status, startTime = null) => ({
  attributes: {
    tournamentID: '10793', tournamentStageID: stageID, name: `${p1} vs ${p2}`, status, startDate: todayKey, startTime,
    participant1Score: status === 'Result' ? 6 : null, participant2Score: status === 'Result' ? 3 : null,
    tournament, stage: { tournamentStageID: stageID, name: stage },
    participant1: { firstName: p1.split(' ')[0], lastName: p1.split(' ')[1] }, participant2: { firstName: p2.split(' ')[0], lastName: p2.split(' ')[1] }
  }
});
const feed = { data: [
  fixture('3', 'Last 64', 'Luke Humphries', 'Tommy Morris', 'Fixture'),
  fixture('2', 'Last 128', 'Luke Humphries', 'Jan Jansen', 'Result', '13:05:00'),
  fixture('2', 'Last 128', 'Tommy Morris', 'Piet Pietersen', 'Result'),
  fixture('2', 'Last 128', 'Danny Noppert', 'Kees Klaassen', 'Result')
] };

class Local extends ResourceLoader {
  fetch(url) {
    const file = new URL(url).pathname.split('/').pop();
    if (/\.(js|css)$/.test(file) && fs.existsSync(`${root}/${file}`)) return Promise.resolve(fs.readFileSync(`${root}/${file}`));
    return null;
  }
}

(async () => {
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
      window.fetch = async url => {
        const address = String(url);
        if (address.includes('pdcservices')) return { ok: true, status: 200, json: async () => feed };
        if (address.includes('darts-pluto.json')) return { ok: true, status: 200, json: async () => ({ schema: 1, broadcasts: [] }) };
        return { ok: true, status: 200, json: async () => ({ events: [], matches: [], data: [], items: [] }) };
      };
    }
  });
  const w = dom.window;
  await new Promise(r => w.addEventListener('load', r));
  await wait(200);

  w.__feed = feed.data;
  const [event] = w.eval('normalizePdcDartsSchedule(window.__feed)');
  assert.equal(event.title, 'Players Championship 34');
  assert.equal(event.channel, 'PDCTV');
  assert.equal(event.time, 'TBD', 'geen verzonnen starttijd voor vloertoernooien');
  assert.equal(event.live, true, 'bezig: uitslagen en nog open partijen vandaag');
  assert.equal(event.matches.map(m => m.label).join('|'), 'Laatste 128|Laatste 64', 'per ronde, in volgorde');
  assert.equal(event.matches[0].items.length, 3);
  assert.ok(event.matches[0].items.every(item => !/^\d{2}:\d{2}/.test(item)), 'geen tijden per vloerpartij');
  assert.equal(w.eval('isPdcFloorTournament("2026 Players Championship Finals")'), false, 'Finals blijft het tv-toernooi');
  assert.equal(w.eval('normalizePdcDartsResults(window.__feed).filter(r => r.score).length'), 3, 'uitslagen van vloerpartijen');

  w.document.querySelector('.sport-filter-btn[data-sport="darts"]').click();
  await wait(800);
  const row = [...w.document.querySelectorAll('.darts-expandable')].find(r => /Players Championship 34/i.test(r.textContent));
  assert.ok(row, 'vloertoernooi zichtbaar in de dartsagenda');
  assert.equal(row.getAttribute('aria-expanded'), 'false', 'vloertoernooi start ingeklapt');
  const list = w.document.getElementById(row.dataset.eventId);
  assert.equal(list.style.display, 'none');
  row.click();
  assert.equal(list.style.display, 'block');
  assert.match(list.textContent, /Luke Humphries vs Jan Jansen/);
  assert.deepEqual(errors, []);
  console.log('PDC-vloertoernooien: per ronde, PDCTV, ingeklapt, geen verzonnen tijden en uitslagen geslaagd');
  w.close();
})().catch(e => { console.error(e); process.exit(1); });
