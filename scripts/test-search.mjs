import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const core = require('../search-enhancements.js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const events = [
    {
        sportType: 'voetbal',
        home: 'Ajax',
        away: 'PSV',
        competition: 'Eredivisie',
        title: 'Ajax - PSV',
        channel: 'ESPN'
    },
    {
        sportType: 'voetbal',
        home: 'Atlético',
        away: 'Real Madrid',
        competition: 'La Liga',
        channel: 'Ziggo Sport'
    },
    {
        sportType: 'darts',
        title: 'Premier League Darts',
        competition: 'Premier League Darts',
        channel: 'Viaplay',
        matches: [{ home: 'Michael van Gerwen', away: 'Luke Littler' }]
    },
    {
        sportType: 'motogp',
        title: 'Grand Prix van Catalonië',
        competition: 'MotoGP',
        channel: 'Ziggo Sport'
    }
];

assert.equal(core.normalize('Atlético  Madrid'), 'atletico madrid');
assert.equal(core.matchesEvent(events[0], 'Ajax'), true);
assert.equal(core.matchesEvent(events[0], 'ajax espn'), true);
assert.equal(core.matchesEvent(events[0], 'Nederland'), true);
assert.equal(core.matchesEvent(events[0], 'Holland'), true);
assert.equal(core.matchesEvent(events[1], 'Spanje ziggo'), true);
assert.equal(core.matchesEvent(events[2], 'Darts Van Gerwen'), true);
assert.equal(core.matchesEvent(events[3], 'MotoGP Catalonie'), true);
assert.equal(core.matchesEvent(events[0], 'Darts'), false);

const suggestions = core.buildSuggestions(events);
assert.deepEqual(
    core.filterSuggestions(suggestions, 'Aja')[0],
    { value: 'Ajax', type: 'Team', aliases: '' }
);
assert.deepEqual(
    core.filterSuggestions(suggestions, 'Neder').map(item => [item.value, item.type]),
    [['Nederland', 'Land']]
);
assert.deepEqual(
    core.filterSuggestions(suggestions, 'Ziggo').map(item => [item.value, item.type]),
    [['Ziggo Sport', 'Zender']]
);
assert.deepEqual(
    core.filterSuggestions(suggestions, 'Gerwen').map(item => [item.value, item.type]),
    [['Michael van Gerwen', 'Speler']]
);
assert.equal(core.filterSuggestions(suggestions, 'formule').some(item => item.value === 'F1'), true);

const competitionCounts = core.countCompetitions(events);
assert.deepEqual(
    competitionCounts.find(item => item.value === 'Eredivisie'),
    { value: 'Eredivisie', count: 1, group: 'Nederland' }
);
assert.equal(core.competitionGroup('Champions League'), 'Europa');
assert.equal(core.competitionGroup('Premier League Darts'), 'Overig');

const index = readFileSync(path.join(root, 'index.html'), 'utf8');
const policy = readFileSync(path.join(root, 'football-policy.js'), 'utf8');
const releaseNotes = readFileSync(path.join(root, 'release-notes.js'), 'utf8');

assert.match(index, /id="sport-search"/);
assert.match(index, /id="competition-filter-btn"/);
assert.match(index, /data-competition="\$\{escapeHtml\(event\.competition \|\| ''\)\}"/);
assert.match(index, /search-enhancements\.js\?v=3\.12\.0/);
assert.match(index, /release-notes\.js\?v=3\.12\.0/);
assert.match(index, /football-policy\.js\?v=3\.12\.0/);
assert.match(index, /currentSportFilter === 'voetbal' && filters\.competitions/);
assert.doesNotMatch(policy, /createElement\(['"]script['"]\)/);
assert.match(releaseNotes, /version: '3\.12\.0'/);
assert.match(releaseNotes, /document\.readyState === 'loading'/);

console.log('Search and filter checks passed.');
