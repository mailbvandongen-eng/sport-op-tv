import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const core = require('../search-enhancements.js');
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const index = read('../index.html');
const release = read('../release-notes.js');
const css = read('../search-ui.css');
const code = read('../search-enhancements.js');
function between(start, end) {
    const a = index.indexOf(start), b = index.indexOf(end, a + start.length);
    assert.ok(a >= 0 && b > a); return index.slice(a, b);
}
const events = [
    { sportType: 'voetbal', home: 'Ajax', away: 'PSV', competition: 'Eredivisie', channel: 'ESPN', score: '2-1', dateKey: '2026-10-09' },
    { sportType: 'voetbal', home: 'Ajax', away: 'Roma', competition: 'Europa League', channel: 'Ziggo Sport', score: '1-0', dateKey: '2026-10-09' },
    { sportType: 'voetbal', home: 'Nederland', away: 'Hongarije', competition: 'Nations League', channel: 'NPO 1', score: '3-0', dateKey: '2026-10-09' },
    { sportType: 'voetbal', home: 'Netherlands Women', away: 'Hungary', competition: 'WK Kwalificatie Vrouwen', channel: 'NPO 3', score: '2-0', dateKey: '2026-10-09' },
    { sportType: 'darts', title: 'World Grand Prix', competition: 'World Grand Prix', channel: 'Viaplay', home: 'Michael van Gerwen', away: 'Luke Littler', score: '3-2', dateKey: '2026-10-09', matches: [{ home: 'Michael van Gerwen', away: 'Luke Littler' }] }
];
assert.equal(core.normalize('Atlético Madrid'), 'atletico madrid');
assert.equal(core.matchesEvent(events[0], 'Ajax espn'), true);
assert.equal(core.matchesEvent(events[0], 'Nederland'), false, 'Country search must not match domestic leagues');
assert.equal(core.matchesEvent(events[2], 'nl mannen'), true);
assert.equal(core.matchesEvent(events[3], 'Nederland vrouwen'), true);
assert.equal(core.matchesEvent(events[2], 'Nederland vrouwen'), false);
assert.equal(core.matchesEvent(events[4], 'Darts Van Gerwen'), true);
assert.equal(core.teamInfo('Nederland', 'Nations League').value, 'land:nederland:mannen');
assert.equal(core.teamInfo('Netherlands Women', 'WK Kwalificatie Vrouwen').value, 'land:nederland:vrouwen');
assert.equal(core.teamInfo('Nederland Vrouwen', 'WK Kwalificatie Vrouwen').value, 'land:nederland:vrouwen');
assert.equal(core.teamInfo('Ajax Amsterdam', 'Europa League').value, 'club:ajax:mannen');
assert.equal(core.teamInfo('Ajax', "Women's Champions League").value, 'club:ajax:vrouwen');
assert.equal(core.competitionGroup("Women's Champions League"), 'Europa');
const teams = core.buildTeams(events, ['club:unseen:mannen'], ['Ajax', 'Ajax Amsterdam', 'PSV']);
assert.equal(teams.filter(item => item.value === 'club:ajax:mannen').length, 1);
assert.equal(teams.find(item => item.value === 'club:ajax:mannen').count, 2);
assert.ok(teams.some(item => item.value === 'club:unseen:mannen'), 'Selections survive absence of fixtures');
assert.ok(core.buildTeams([]).some(item => item.label === 'Nederland — vrouwen'), 'Oranje always selectable');
const suggestions = core.buildSuggestions(events);
assert.equal(core.filterSuggestions(suggestions, 'Aja')[0].type, 'Club');
assert.deepEqual(core.filterSuggestions(suggestions, 'Nederland').map(item => item.value), ['Nederland — mannen', 'Nederland — vrouwen']);
assert.ok(core.filterSuggestions(suggestions, 'Gerwen').some(item => item.value === 'Michael van Gerwen'));
const filters = { teams: ['club:ajax:mannen'], competitions: ['Europa League'] };
assert.deepEqual(events.filter(e => core.matchesFootballFilters(e, filters)).map(e => e.away), ['Roma']);
assert.equal(core.matchesFootballFilters(events[3], { teams: ['land:nederland:mannen'] }), false);
assert.equal(core.matchesFootballFilters(events[3], { teams: ['land:nederland:vrouwen'] }), true);
assert.equal(core.matchesFootballFilters(events[0], {}), true);

// Exercise the actual app API: filters persist, search stays in sport and filters,
// and changing selections renders only when explicitly applied.
const storage = new Map(); let renders = 0;
const ctx = vm.createContext({ window: { SPORT_OP_TV_SEARCH_CORE: core },
    filters: { teams: [], competitions: [] }, currentSportFilter: 'voetbal', resultsMode: false,
    cachedData: { voetbal: events.filter(e => e.sportType === 'voetbal'), darts: [events[4]], f1: [], motogp: [], handbal: [] },
    ISER_FOOTBALL_POLICY: require('../football-policy.js'), CONFIG: { ESPN_COMPETITIONS: [] },
    renderEvents: () => { renders++; return Promise.resolve(); }, setSportFilter() {},
    buildResultItems: () => events, localStorage: { setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k), getItem: k => storage.get(k) || null }
});
vm.runInContext(between('        function getEventSearchText(', '        // Hamburger Menu'), ctx);
ctx.window.SPORT_OP_TV_APP.setFootballFilters(filters, false);
assert.equal(renders, 0);
assert.deepEqual(JSON.parse(storage.get('selectedFootballTeams')), filters.teams);
assert.equal(ctx.window.SPORT_OP_TV_APP.getSearchEvents().length, 1);
assert.equal(ctx.currentSportFilter, 'voetbal');
ctx.window.SPORT_OP_TV_APP.setFootballFilters(filters);
assert.equal(renders, 1);
ctx.currentSportFilter = 'darts';
assert.equal(ctx.window.SPORT_OP_TV_APP.getSearchEvents()[0].sportType, 'darts');
ctx.currentSportFilter = null;
assert.equal(ctx.window.SPORT_OP_TV_APP.getSearchEvents().length, 2, 'All-sports mode still respects football filters');
ctx.currentSportFilter = 'voetbal'; ctx.resultsMode = true;
assert.equal(ctx.window.SPORT_OP_TV_APP.getSearchEvents().length, 1);
vm.runInContext(between('        function getStoredCompetitionFilters(', '        let worldCupHighlightIndex'), ctx);
assert.deepEqual(Array.from(ctx.window.SPORT_OP_TV_APP.getFootballFilters().teams), filters.teams, 'Reload preserves teams');

// Real results renderer must use the same sport/team/competition filters.
Object.assign(ctx, { ensureDartsResultsLoaded: async () => [], hasKnownScore: () => true,
    isSameDay: () => false, formatDate: () => 'Vandaag', escapeHtml: String,
    getResultSportLabel: value => value });
vm.runInContext(between('        async function renderResultsView(', '        function showLoading('), ctx);
for (const [sport, expected] of [['voetbal', ['Ajax - Roma']], ['darts', ['Michael van Gerwen - Luke Littler']], [null, ['Ajax - Roma', 'Michael van Gerwen - Luke Littler']]]) {
    ctx.currentSportFilter = sport;
    const container = { innerHTML: '' };
    await ctx.renderResultsView(container, ['2026-10-09']);
    for (const label of expected) assert.ok(container.innerHTML.includes(label));
    assert.ok(!container.innerHTML.includes('Ajax - PSV'));
    assert.ok(!container.innerHTML.includes('Nederland - Hongarije'));
}
assert.doesNotMatch(code, /app\.setSportFilter\(null|setSportFilter\(null/);
assert.doesNotMatch(index, /forceRefreshSports\.has\('voetbal'\) \|\| resultsMode/);
assert.doesNotMatch(index, /forceRefreshSports\.has\('darts'\) \|\| resultsMode/);
assert.match(css, /\[hidden\].*display: none !important/s);
const version = release.match(/version: '([^']+)'/)[1];
for (const file of ['search-enhancements.js', 'release-notes.js', 'football-policy.js', 'search-ui.css']) assert.ok(index.includes(`${file}?v=${version}`));
assert.match(index, /id="search-clear"/);
assert.match(index, /id="program-toggle"/);
console.log('Scoped search, men/women teams, combined filters, storage, API and results rendering passed.');
