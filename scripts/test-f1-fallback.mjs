// F1: OpenF1 geeft 401 tijdens live sessies; dan Jolpica, daarna het bewaarde schema.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('        function getF1SessionLabel('), source.indexOf('        // Static football data'));
const brazil = {
    raceName: 'Brazilian Grand Prix', date: '2026-11-08', time: '17:00:00Z',
    Circuit: { circuitName: 'Autódromo José Carlos Pace', Location: { locality: 'São Paulo', country: 'Brazil' } },
    FirstPractice: { date: '2026-11-06', time: '15:30:00Z' }, SecondPractice: { date: '2026-11-06', time: '19:00:00Z' },
    ThirdPractice: { date: '2026-11-07', time: '14:30:00Z' }, Qualifying: { date: '2026-11-07', time: '18:00:00Z' }
};
const vegas = { date: '2026-11-22', time: '04:00:00Z', Circuit: { circuitName: 'Las Vegas Strip Street Circuit', Location: { locality: 'Las Vegas', country: 'USA' } },
    Sprint: { date: '2026-11-21', time: '01:00:00Z' } };

function run(responses, stored = null) {
    const storage = new Map(stored ? [['f1SessionsSnapshot', JSON.stringify(stored)]] : []);
    const ctx = vm.createContext({
        Date, AbortSignal, console: { warn() {}, error() {} },
        CONFIG: { F1_API_URL: 'https://openf1.test' },
        localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
        isLiveNow: (start, end) => new Date('2026-11-06T19:30:00Z') >= new Date(start) && new Date('2026-11-06T19:30:00Z') <= new Date(end),
        fetch: async url => responses(String(url))
    });
    vm.runInContext(code, ctx);
    return vm.runInContext('fetchF1Sessions()', ctx).then(sessions => ({ sessions, storage }));
}
const live401 = { ok: false, status: 401, json: async () => ({ detail: 'Live F1 session in progress.' }) };

// 1. OpenF1 geblokkeerd tijdens VT2 -> Jolpica-schema met live-markering.
let { sessions } = await run(url => url.includes('jolpi') ? { ok: true, json: async () => ({ MRData: { RaceTable: { Races: [brazil, vegas] } } }) } : live401);
const fp2 = sessions.find(s => s.title === 'Vrije training 2');
assert.ok(fp2, 'VT2 uit Jolpica');
assert.equal(fp2.time, '20:00');
assert.equal(fp2.competition, 'GP Brazil');
assert.equal(fp2.live, true, 'VT2 staat live tijdens de sessie');
assert.equal(sessions.filter(s => s.competition === 'GP Brazil').length, 5);
assert.equal(sessions.find(s => s.title === 'Race' && s.competition === 'GP Brazil').time, '18:00');
assert.equal(sessions.find(s => s.title === 'Sprint').competition, 'GP United States');

// 2. Beide bronnen weg -> laatst bewaarde OpenF1-sessies.
const saved = [{ date_start: '2026-11-06T19:00:00Z', date_end: '2026-11-06T20:00:00Z', session_name: 'Practice 2', country_name: 'Brazil', circuit_short_name: 'Interlagos', location: 'São Paulo' }];
({ sessions } = await run(() => { throw new Error('offline'); }, saved));
assert.equal(sessions.length, 1);
assert.equal(sessions[0].location, 'Interlagos · São Paulo');

// 3. OpenF1 werkt -> wordt bewaard voor later.
const result = await run(() => ({ ok: true, json: async () => saved }));
assert.equal(result.sessions.length, 1);
assert.ok(result.storage.get('f1SessionsSnapshot'));

console.log('F1-fallback: OpenF1 401 tijdens live sessie -> Jolpica (met live-markering), daarna bewaard schema; geslaagd.');
