// Pluto-darts: parser van dartn.de en weergave in de dartsagenda.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const root = require('node:path').resolve(__dirname, '..');
const { parse, parseRow, merge } = require('./update-pluto-darts.cjs');

const html = `<h2>Weitere Streams von
Dart-Turnieren:</h2><table><tbody>
<tr><td><strong>Datum</strong></td><td><strong>Event</strong></td><td><strong>Wo zu
verfolgen?</strong></td></tr>
<tr><td>Sa., 07.11.2026 ab 13:30 Uhr &amp; 20:00 Uhr</td><td>ADC Global Championship</td><td>Pluto TV X Modus Super Series</td></tr>
<tr><td>Fr., 06.11.2026 ab 19:00 Uhr</td><td>CDC Continental Cup</td><td>PDC.TV</td></tr>
<tr><td>So., 15.11.2026 ab 14:00 Uhr</td><td>Grand Slam of Darts</td><td>DAZN Darts X Pluto TV</td></tr>
<tr><td>09.11.–14.11.2026</td><td>MODUS Super Series</td><td>Pluto TV X Modus Super Series</td></tr>
</tbody></table>`;
const rows = parse(html);
assert.equal(rows.length, 1, 'alleen Pluto-rijen buiten PDC/DAZN met vaste datum en tijd');
assert.deepEqual(rows[0].sessions.map(s => s.time), ['13:30', '20:00']);
assert.equal(rows[0].date, '2026-11-07');
assert.throws(() => parse('<p>geen tabel</p>'), /niet gevonden/);
assert.equal(parseRow(['Mo., 02.11.2026', 'X', 'Pluto TV']), null, 'geen tijd = geen rij');

const old = [{ ...rows[0], id: 'a', date: '2026-11-01' }, { ...rows[0], id: 'b', date: '2026-10-01' }, { ...rows[0], id: 'c', date: '2026-11-07', time: '12:00' }];
assert.deepEqual(merge(old, rows, '2026-11-05').map(r => r.id), ['a', rows[0].id], 'recente historie blijft, oude en vervangen dagen niet');

const dateKey = d => d.toLocaleDateString('en-CA');
const today = new Date();
const tomorrow = new Date(today.getTime() + 86400000);
const snapshot = { schema: 1, broadcasts: [{ id: 'x', date: dateKey(tomorrow), time: '13:30', event: 'ADC Global Championship', channel: 'Pluto TV', stream: 'Pluto TV X Modus Super Series', sessions: [{ time: '13:30', label: 'Middagsessie' }, { time: '20:00', label: 'Avondsessie' }], source: 'dartn.de' }] };

class Local extends ResourceLoader {
  fetch(url) {
    const file = new URL(url).pathname.split('/').pop();
    if (fs.existsSync(`${root}/${file}`) && /\.(js|css)$/.test(file)) return Promise.resolve(fs.readFileSync(`${root}/${file}`));
    return null;
  }
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const releaseVersion = fs.readFileSync(`${root}/release-notes.js`, 'utf8').match(/version: '([0-9.]+)'/)[1];

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
        if (address.includes('data/darts-pluto.json')) return { ok: true, status: 200, json: async () => snapshot };
        if (address.includes('pdcservices')) return { ok: true, status: 200, json: async () => ({ data: [] }) };
        return { ok: true, status: 200, json: async () => ({ events: [], matches: [], data: [], items: [] }) };
      };
    }
  });
  const w = dom.window;
  await new Promise(r => w.addEventListener('load', r));
  await wait(200);
  w.document.querySelector('.sport-filter-btn[data-sport="darts"]').click();
  await wait(800);
  const text = w.document.body.textContent;
  assert.match(text, /ADC GLOBAL CHAMPIONSHIP/i, 'Pluto-toernooi zichtbaar in dartsagenda');
  const badge = [...w.document.querySelectorAll('a.channel-badge')].find(a => a.textContent.includes('Pluto TV'));
  assert.ok(badge, 'Pluto TV-badge is een link');
  assert.match(text, /Avondsessie \(20:00 start\)/);
  const events = w.eval('getStaticDartsEvents()').filter(e => e.channel === 'Pluto TV');
  assert.equal(events.length, 1);
  assert.equal(events[0].live, false);
  assert.equal(JSON.parse(w.localStorage.getItem('dartsPlutoSnapshot')).length, 1);
  assert.deepEqual(errors, []);
  console.log('Pluto-darts tests geslaagd');
  w.close();
})().catch(e => { console.error(e); process.exit(1); });
