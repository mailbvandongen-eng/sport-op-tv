import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const headers = [...source.matchAll(/\.day-header\s*\{([^}]+)\}/g)].map(match => match[1]);
assert.ok(headers.length);
assert.ok(headers.some(css => /position:\s*static/.test(css)));
assert.ok(headers.every(css => !/position:\s*sticky|top:\s*\d/.test(css)), 'Dagkop mag geen wedstrijdregels overlappen');
assert.match(source, /class="event-location"/);

const f1 = source.slice(source.indexOf('        function getF1SessionLabel('), source.indexOf('        // Static football data'));
const ctx = vm.createContext({
    Date, CONFIG: { F1_API_URL: 'https://fixture.test' }, console,
    isLiveNow: () => false,
    fetch: async () => ({ ok: true, json: async () => [{
        date_start: '2026-10-09T12:30:00Z', session_name: 'Sprint Qualifying',
        country_name: 'Singapore', circuit_short_name: 'Marina Bay', location: 'Singapore'
    }] })
});
vm.runInContext(f1, ctx);
const sessions = await vm.runInContext('fetchF1Sessions()', ctx);
assert.equal(sessions[0].title, 'Sprintkwalificatie');
assert.equal(sessions[0].time, '14:30');
assert.equal(sessions[0].location, 'Marina Bay · Singapore');

// Exercise the real accordion handler, including repeat binding and keyboard input.
const rows = [];
const lists = new Map();
function makeRow(id) {
    const classes = new Set();
    const handlers = {};
    const attributes = {};
    const row = {
        dataset: { eventId: id },
        classList: { contains: key => classes.has(key), add: key => classes.add(key), remove: key => classes.delete(key) },
        setAttribute: (key, value) => { attributes[key] = value; },
        addEventListener: (key, fn) => { (handlers[key] ||= []).push(fn); },
        click: () => handlers.click.forEach(fn => fn()),
        key: key => handlers.keydown.forEach(fn => fn({ key, preventDefault() {} })), attributes
    };
    rows.push(row);
    lists.set(id, { style: { display: 'none' } });
    return row;
}
const first = makeRow('first');
const second = makeRow('second');
const accordion = source.slice(source.indexOf('        function setupDartsAccordion('), source.indexOf("        // Get today's date string"));
const dom = vm.createContext({ document: {
    querySelectorAll: selector => selector.endsWith('.expanded') ? rows.filter(row => row.classList.contains('expanded')) : rows,
    getElementById: id => lists.get(id)
} });
vm.runInContext(accordion, dom);
vm.runInContext('setupDartsAccordion(); setupDartsAccordion();', dom);
first.click();
assert.equal(lists.get('first').style.display, 'block');
assert.equal(first.attributes['aria-expanded'], 'true');
second.key('Enter');
assert.equal(lists.get('first').style.display, 'none');
assert.equal(lists.get('second').style.display, 'block');
second.key(' ');
assert.equal(lists.get('second').style.display, 'none');
assert.equal(second.attributes['aria-expanded'], 'false');
console.log('Day headers, F1 details/timezone and darts click/keyboard handlers passed.');
