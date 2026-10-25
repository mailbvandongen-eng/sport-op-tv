const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const fs = require('fs');
const assert = require('node:assert/strict');
const root = require('path').resolve(__dirname, '..');
const releaseVersion = fs.readFileSync(`${root}/release-notes.js`, 'utf8').match(/version: '([0-9.]+)'/)[1];
const handball = require(`${root}/data/handball-men.json`);
const today = new Date();
today.setHours(12, 0, 0, 0);
const football = [{
  home: 'Ajax', away: 'PSV', competition: 'Eredivisie', channel: 'ESPN',
  date: today.toISOString(), time: '12:00', score: '2-1', source: 'ESPN'
}];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

class Local extends ResourceLoader {
  fetch(url) {
    const file = new URL(url).pathname.split('/').pop();
    if (['football-policy.js', 'search-enhancements.js', 'release-notes.js', 'search-ui.css', 'guide-ui.css', 'standings-config.js', 'standings-menu.js', 'standings-menu.css'].includes(file)) {
      return Promise.resolve(Buffer.from(fs.readFileSync(`${root}/${file}`)));
    }
    return null;
  }
}

function createApp(fetchImpl, cacheAgeMs = 0) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(fs.readFileSync(`${root}/index.html`, 'utf8'), {
    url: 'https://test.sport.local/', runScripts: 'dangerously', resources: new Local(),
    pretendToBeVisual: true, virtualConsole,
    beforeParse(window) {
      window.scrollTo = () => {};
      window.HTMLElement.prototype.scrollIntoView = function () {};
      window.IntersectionObserver = class { observe() {} disconnect() {} };
      window.fetch = fetchImpl;
      window.localStorage.setItem('cacheVersion', '3.12.8');
      window.localStorage.setItem('sportOpTvSeenRelease', releaseVersion);
      window.localStorage.setItem('selectedCompetitions', JSON.stringify(['Eredivisie']));
      window.localStorage.setItem('selectedFootballTeams', JSON.stringify(['club:ajax:mannen']));
      window.localStorage.setItem('sportOpTvFootballPreferences', JSON.stringify({ teams: ['club:ajax:mannen'], competitions: ['Eredivisie'] }));
      window.localStorage.setItem('footballCache', JSON.stringify(football));
      window.localStorage.setItem('footballCacheTime', String(Date.now() - cacheAgeMs));
    }
  });
  return { dom, errors };
}

function jsonResponse(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

async function testLazySportSelection() {
  const requests = [];
  const { dom, errors } = createApp(async url => {
    const address = String(url);
    requests.push(address);
    if (address.includes('handball-men.json')) return jsonResponse(handball);
    if (address.includes('openf1')) return jsonResponse([]);
    if (address.includes('nos-highlights')) return jsonResponse({ items: [] });
    if (address.includes('pdcservices')) return jsonResponse({ data: [] });
    return jsonResponse({ events: [], matches: [], data: [] });
  });
  const { document } = dom.window;
  const settle = () => wait(100);
  const visible = selector => [...document.querySelectorAll(selector)].filter(row => !row.hidden);
  await new Promise(resolve => dom.window.addEventListener('load', resolve));
  await settle();
  const app = dom.window.SPORT_OP_TV_APP;
  assert.ok(app, 'app control API should initialize');
  assert.equal(app.getSportFilter(), 'voetbal');
  assert.equal(visible('.football-slot-match').length, 1, 'cached football should appear immediately');
  assert.ok(!requests.some(url => /pdcservices|openf1|handball-men/.test(url)), 'other sports must not load at startup');

  const requestCount = requests.length;
  document.querySelector('[data-sport="voetbal"]').click();
  await settle();
  assert.equal(app.getSportFilter(), 'voetbal', 're-tapping the selected sport keeps it selected');
  assert.equal(requests.length, requestCount, 're-tapping the selected sport does not reload sources');

  document.querySelector('[data-sport="handbal"]').click();
  await settle();
  assert.equal(app.getSportFilter(), 'handbal');
  assert.ok(requests.some(url => url.includes('handball-men.json')));
  assert.ok(visible('.handbal-row').length > 0, 'handball schedule should render when selected');
  assert.equal(visible('.football-slot-match').length, 0, 'football must never appear in handball view');
  assert.ok([...visible('.handbal-row')].every(row => row.textContent.includes('vs')));

  const handballRequestCount = requests.filter(url => url.includes('handball-men.json')).length;
  document.querySelector('[data-sport="handbal"]').click();
  await settle();
  assert.equal(app.getSportFilter(), 'handbal', 're-tapping handball does not switch to all sports');
  assert.equal(requests.filter(url => url.includes('handball-men.json')).length, handballRequestCount);

  document.querySelector('[data-sport="voetbal"]').click();
  await settle();
  assert.equal(app.getSportFilter(), 'voetbal');
  assert.equal(visible('.football-slot-match').length, 1);
  assert.equal(visible('.handbal-row').length, 0);
  assert.deepEqual(JSON.parse(dom.window.localStorage.getItem('selectedCompetitions')), ['Eredivisie']);
  assert.deepEqual(JSON.parse(dom.window.localStorage.getItem('selectedFootballTeams')), ['club:ajax:mannen']);
  assert.deepEqual(JSON.parse(dom.window.localStorage.getItem('sportOpTvFootballPreferences')),
    { teams: ['club:ajax:mannen'], competitions: ['Eredivisie'] });
  assert.equal(dom.window.localStorage.getItem('cacheVersion'), '3.12.8', 'the app must not clear users’ cache on this update');
  assert.equal(errors.length, 0, errors.join('\n'));
  dom.window.close();
}

async function testStaleCacheAndBoundedRefresh() {
  const requests = [];
  const pendingOpenFootball = [];
  let activeEspn = 0;
  let maxActiveEspn = 0;
  const { dom, errors } = createApp(url => {
    const address = String(url);
    requests.push(address);
    if (address.includes('nos-highlights')) return Promise.resolve(jsonResponse({ items: [] }));
    if (address.includes('raw.githubusercontent.com/openfootball/')) {
      return new Promise(resolve => pendingOpenFootball.push(() => resolve(jsonResponse({ matches: [] }))));
    }
    if (address.includes('site.api.espn.com')) {
      activeEspn += 1;
      maxActiveEspn = Math.max(maxActiveEspn, activeEspn);
      const isRange = address.includes('dates=') && address.split('dates=')[1].includes('-');
      const isFallbackCompetition = address.includes('/ned.1/scoreboard') && isRange;
      return new Promise(resolve => setTimeout(() => {
        activeEspn -= 1;
        resolve(jsonResponse({ events: [] }, isFallbackCompetition ? 400 : 200));
      }, 8));
    }
    return Promise.resolve(jsonResponse({ data: [], events: [], matches: [] }));
  }, 3 * 60 * 60 * 1000);

  const { document } = dom.window;
  const visible = selector => [...document.querySelectorAll(selector)].filter(row => !row.hidden);
  await new Promise(resolve => dom.window.addEventListener('load', resolve));
  await wait(100);
  assert.equal(visible('.football-slot-match').length, 1, 'stale football cache appears before network refresh completes');
  assert.ok(requests.some(url => url.includes('openfootball')), 'stale football cache triggers a background refresh');
  assert.ok(pendingOpenFootball.length > 0, 'OpenFootball refresh starts configured files');

  pendingOpenFootball.splice(0).forEach(release => release());
  await wait(1200);
  assert.ok(requests.filter(url => url.includes('site.api.espn.com')).length > 10, 'ESPN competitions are refreshed');
  assert.ok(maxActiveEspn <= 12, `ESPN concurrency exceeded the bounded limit: ${maxActiveEspn}`);
  assert.equal(visible('.football-slot-match').length, 1, 'last good schedule remains visible after empty upstream responses');
  assert.ok(JSON.parse(dom.window.localStorage.getItem('footballCache')).some(match => match.home === 'Ajax'));
  assert.equal(errors.length, 0, errors.join('\n'));
  dom.window.close();
}

(async () => {
  await testLazySportSelection();
  await testStaleCacheAndBoundedRefresh();
  console.log('Sport loading: startup is football-only, re-tapping keeps the sport, cross-sport rows stay isolated, stale football stays visible, cache/preferences survive, and ESPN refresh concurrency is bounded.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
