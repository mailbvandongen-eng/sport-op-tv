const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const dayStart = html.indexOf("{ date: '2026-10-25'");
const dayEnd = html.indexOf('// Grand Slam of Darts 2026', dayStart);
assert.notEqual(dayStart, -1, 'European Championship finals day fallback exists');
assert.notEqual(dayEnd, -1, 'European Championship fallback ends before the next tournament');

const day = html.slice(dayStart, dayEnd);
assert.match(day, /time: '13:00', event: 'European Championship'/);
assert.match(day, /dartsSession\('13:00', 'Middagsessie - Kwartfinales'\)/);
assert.match(day, /dartsSession\('19:00', 'Avondsessie - Halve finales \+ finale'\)/);
assert.match(html, /function haveSameDartsTournamentName/);
assert.match(html, /haveSameDartsTournamentName\(/);

console.log('Darts finals-day fallback and PDC/static deduplication checks passed.');
