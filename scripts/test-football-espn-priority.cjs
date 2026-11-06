// ESPN-dagoverzicht gaat voor OpenFootball: geen dubbele wedstrijden met voorlopige tijden.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const root = require('node:path').resolve(__dirname, '..');
const releaseVersion = fs.readFileSync(`${root}/release-notes.js`, 'utf8').match(/version: '([0-9.]+)'/)[1];
const wait = ms => new Promise(r => setTimeout(r, ms));

class Local extends ResourceLoader {
  fetch(url) {
    const file = new URL(url).pathname.split('/').pop();
    if (/\.(js|css)$/.test(file) && fs.existsSync(`${root}/${file}`)) return Promise.resolve(fs.readFileSync(`${root}/${file}`));
    return null;
  }
}

const day = offset => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString('en-CA'); };
const saturday = day(1), farAhead = day(20);
const openFootball = { matches: [
  { date: saturday, time: '16:00', team1: 'Nottingham Forest FC', team2: 'Manchester City FC' },
  { date: farAhead, time: '16:00', team1: 'Arsenal FC', team2: 'Chelsea FC' }
] };
const espnEvent = (id, leagueId, home, away, isoDate) => ({
  id, uid: `s:600~l:${leagueId}~e:${id}`, date: isoDate,
  competitions: [{ competitors: [
    { homeAway: 'home', team: { shortDisplayName: home }, score: '0' },
    { homeAway: 'away', team: { shortDisplayName: away }, score: '0' }
  ], status: { type: { completed: false, state: 'pre' } } }]
});

function createApp(espnDayFails) {
  const requests = [];
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
        requests.push(address);
        const ok = data => ({ ok: true, status: 200, json: async () => data });
        if (address.includes('openfootball') && address.endsWith('en.1.json')) return ok(openFootball);
        if (address.includes('openfootball')) return ok({ matches: [] });
        if (espnDayFails && address.includes('espn.com')) return { ok: false, status: 503, json: async () => ({}) };
        if (address.includes('/all/scoreboard')) {
          const dates = new URL(address).searchParams.get('dates');
          return ok({ events: dates === saturday.replace(/-/g, '') ? [espnEvent('9', '700', 'Nottm Forest', 'Manchester City', `${saturday}T17:30:00Z`)] : [] });
        }
        return ok({ events: [], matches: [], data: [], items: [] });
      };
    }
  });
  return { dom, requests, errors };
}

(async () => {
  // 1. ESPN levert: alleen de ESPN-wedstrijd, met de echte tijd; OpenFootball buiten het ESPN-venster blijft.
  let { dom, requests, errors } = createApp(false);
  await new Promise(r => dom.window.addEventListener('load', r));
  await wait(200);
  requests.length = 0; // het opstarten laadt zelf ook voetbal; tel alleen de geforceerde verversing
  let matches = await dom.window.eval('fetchFootballMatches({ force: true })');
  const forest = matches.filter(m => /forest/i.test(m.home));
  assert.equal(forest.length, 1, 'Forest–City één keer, niet ook met de OpenFootball-standaardtijd');
  assert.equal(forest[0].source, 'ESPN');
  assert.ok(matches.some(m => m.home === 'Arsenal' && m.source === 'OpenFootball'), 'verder vooruit blijft OpenFootball');
  assert.equal(requests.filter(u => u.includes('/all/scoreboard')).length, 11, 'één ESPN-verzoek per dag');
  assert.equal(requests.filter(u => /soccer\/(?!all\/)[^/]+\/scoreboard/.test(u)).length, 0, 'geen losse competitieverzoeken als het dagoverzicht werkt');
  assert.deepEqual(errors, []);
  dom.window.close();

  // 2. ESPN helemaal weg: OpenFootball blijft zichtbaar (geen lege agenda).
  ({ dom, requests, errors } = createApp(true));
  await new Promise(r => dom.window.addEventListener('load', r));
  await wait(200);
  matches = await dom.window.eval('fetchFootballMatches({ force: true })');
  assert.ok(matches.some(m => /forest/i.test(m.home) && m.source === 'OpenFootball'), 'zonder ESPN blijft OpenFootball staan');
  dom.window.close();

  console.log('Voetbal: ESPN-dagoverzicht gaat voor OpenFootball, geen dubbele wedstrijden, OpenFootball als vangnet; geslaagd.');
})().catch(e => { console.error(e); process.exit(1); });
