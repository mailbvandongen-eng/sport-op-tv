// Podium per partij (Main Stage / Stage Two) uit het PDC-nieuws, en de weergave in de dartsagenda.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const { parseArticle } = require('./update-darts-stages.cjs');
const root = require('node:path').resolve(__dirname, '..');
const releaseVersion = fs.readFileSync(`${root}/release-notes.js`, 'utf8').match(/version: '([0-9.]+)'/)[1];
const wait = ms => new Promise(r => setTimeout(r, ms));
const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());

// 1. Artikel lezen: schema-regels, uitslagregels, sessiekoppen en "Schedule TBC".
const article = {
  publishedDateTime: '2026-11-27T11:30:00Z',
  content: [{ rowData: { widgetData: { content: [
    '<p>Price opens against Bialecki on Friday.</p>',
    '<p><strong>Friday November 27</strong><br>Round One<br>Afternoon Session (1300 GMT)<br>Main Stage<br>',
    'Martin Schindler 6-4 Charlie Manby<br>Joe Cullen 6-3 Richard Veenstra<br><br>Stage Two<br>Tom Bissell v Rob Owen</p>',
    '<p>Evening Session (1900 GMT)<br>Main Stage<br>Jeffrey de Graaf v Gian van Veen<br>Stage Two<br>Stephen Bunting v Max Hopp</p>',
    '<p><strong>Saturday November 28</strong><br>Main Stage<br>Schedule TBC</p>'
  ].join('') } } }]
};
const parsed = parseArticle(article);
assert.deepEqual([...parsed.keys()], ['2026-11-27'], 'alleen dagen met partijen');
assert.deepEqual(parsed.get('2026-11-27').map(m => `${m.stage}:${m.home} v ${m.away}`), [
  'Main Stage:Martin Schindler v Charlie Manby',
  'Main Stage:Joe Cullen v Richard Veenstra',
  'Stage Two:Tom Bissell v Rob Owen',
  'Main Stage:Jeffrey de Graaf v Gian van Veen',
  'Stage Two:Stephen Bunting v Max Hopp'
]);

assert.deepEqual(parsed.get('2026-11-27').map(m => m.session), ['afternoon', 'afternoon', 'afternoon', 'evening', 'evening'], 'sessie uit het schema');

// 2. App: partijen per podium gesplitst, ook met andere volgorde en hoofdletters dan de feed.
const tournament = { tournamentID: '10871', name: '2026 Players Championship Finals', venue: "Butlin's", city: 'Minehead' };
const fixture = (p1, p2, startTime) => ({ attributes: {
  tournamentID: '10871', tournamentStageID: '8', name: `${p1} vs ${p2}`, status: 'Fixture', startDate: todayKey, startTime,
  tournament, stage: { name: 'Last 64' },
  participant1: { firstName: p1.split(' ')[0], lastName: p1.split(' ').slice(1).join(' ') },
  participant2: { firstName: p2.split(' ')[0], lastName: p2.split(' ').slice(1).join(' ') }
} });
const feed = { data: [
  fixture('Charlie Manby', 'Martin Schindler', '13:00:00'),
  fixture('Tom Bissell', 'Rob Owen', '13:00:00'),
  fixture('Jeffrey De Graaf', 'Gian van Veen', '19:00:00'),
  fixture('Stephen Bunting', 'Max Hopp', '19:00:00'),
  fixture('Onbekende Speler', 'Andere Speler', '19:30:00')
] };
const stages = { schema: 1, days: { [todayKey]: { matches: [
  { home: 'Martin Schindler', away: 'Charlie Manby', stage: 'Main Stage' },
  { home: 'Tom Bissell', away: 'Rob Owen', stage: 'Stage Two' },
  { home: 'Jeffrey de Graaf', away: 'Gian van Veen', stage: 'Main Stage' },
  { home: 'Stephen Bunting', away: 'Max Hopp', stage: 'Stage Two' }
] } } };

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
        if (address.includes('darts-stages.json')) return { ok: true, status: 200, json: async () => stages };
        if (address.includes('pluto')) throw new Error('Pluto hoort niet meer opgehaald te worden');
        return { ok: true, status: 200, json: async () => ({ events: [], matches: [], data: [], items: [] }) };
      };
    }
  });
  const w = dom.window;
  await new Promise(r => w.addEventListener('load', r));
  await wait(200);

  w.document.querySelector('.sport-filter-btn[data-sport="darts"]').click();
  await wait(800);
  const event = w.eval('cachedData.darts').find(e => /Players Championship Finals/.test(e.title));
  assert.ok(event, 'Finals in de dartsagenda');
  const labels = event.matches.map(m => m.label);
  assert.ok(labels.some(l => /Middagsessie - Main Stage \(tv\)/.test(l)), labels.join(' | '));
  assert.ok(labels.some(l => /Middagsessie - Stage Two \(alleen PDCTV\)/.test(l)), labels.join(' | '));
  const items = label => event.matches.filter(m => m.label.includes(label)).flatMap(m => m.items).join(' / ');
  assert.match(items('Middagsessie - Main Stage'), /Manby/);
  assert.doesNotMatch(items('Middagsessie - Main Stage'), /Bissell/);
  assert.match(items('Avondsessie - Stage Two'), /Bunting/);
  assert.match(items('Avondsessie - Main Stage'), /Van Veen|van Veen/);
  assert.ok(event.matches.some(m => /^Avondsessie - Laatste 64$/.test(m.label) && m.items.join().includes('Onbekende')), 'zonder podium gewoon in de sessie');
  assert.ok(w.eval('cachedData.darts').every(e => !/pluto/i.test(`${e.channel} ${e.source || ''}`)), 'geen Pluto meer');
  assert.ok(w.localStorage.getItem('dartsStagesSnapshot'), 'podia bewaard op het toestel');
  assert.deepEqual(errors, []);
  w.close();
  console.log('Darts-podia: artikel lezen (schema, uitslagen, verplaatsingen), per podium gesplitst, zonder Pluto; geslaagd.');
})().catch(error => { console.error(error); process.exit(1); });
