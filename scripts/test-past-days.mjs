import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const core = createRequire(import.meta.url)('../search-enhancements.js');

process.env.TZ = 'Europe/Amsterdam';
const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function between(start, end) {
    const from = source.indexOf(start);
    const to = source.indexOf(end, from + start.length);
    assert.ok(from >= 0 && to > from);
    return source.slice(from, to);
}
const dateHelpers = between('        function getLocalDateKey(', '        function dedupeFootballMatches(');
const fetcher = between('        async function fetchESPNMatches(', '        // Get static darts events');
const renderer = between('        async function renderEvents(', "        // Scroll to today's section");
class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : ['2026-10-04T00:26:00+02:00'])); }
    static now() { return new Clock().getTime(); }
}

// ESPN: één dagoverzicht (soccer/all) per dag; bij een mislukte dag alleen die dag per competitie.
for (const failDay of [null, '20261001']) {
    const requests = [];
    const event = (id, leagueId, home) => ({
        id, uid: `s:600~l:${leagueId}~e:${id}`, date: '2026-10-01T18:00:00Z',
        competitions: [{ competitors: [
            { homeAway: 'home', team: { displayName: home }, score: '2' },
            { homeAway: 'away', team: { displayName: 'Roma' }, score: '1' }
        ], status: { type: { completed: true } } }]
    });
    const ctx = vm.createContext({
        Date: Clock, AbortSignal, console: { log() {}, warn() {}, error() {} },
        CONFIG: { ESPN_API_URL: 'https://fixture.test', ESPN_COMPETITIONS: [{ slug: 'uefa.europa', leagueId: '776', name: 'Europa League', channel: 'Ziggo Sport' }] },
        footballSourceHealth: { successful: 0, failed: 0 },
        shouldIncludeEspnMatch: () => true,
        fetch: async url => {
            requests.push(url);
            const { pathname, searchParams } = new URL(url);
            const dates = searchParams.get('dates');
            assert.ok(!dates.includes('-'), 'geen datumperiodes meer');
            if (pathname.includes('/all/') && dates === failDay) return { ok: false, status: 403, json: async () => ({}) };
            const events = dates !== '20261001' ? [] : pathname.includes('/all/')
                ? [event('1', '776', 'Ajax'), event('2', '999', 'Andere competitie')]
                : [event('1', '776', 'Ajax')];
            return { ok: true, status: 200, json: async () => ({ events }) };
        }
    });
    vm.runInContext(dateHelpers + fetcher, ctx);
    const matches = await vm.runInContext('fetchESPNMatches()', ctx);
    assert.equal(matches.length, 1, 'alleen de geconfigureerde competitie, zonder dubbelingen');
    assert.equal(matches[0].home, 'Ajax');
    assert.equal(matches[0].competition, 'Europa League');
    assert.equal(matches[0].score, '2-1');
    const overview = requests.filter(url => url.includes('/all/scoreboard'));
    assert.equal(overview.length, 11, 'één verzoek per dag (3 terug, 7 vooruit)');
    for (const key of ['20261001', '20261002', '20261003']) {
        assert.ok(overview.some(url => new URL(url).searchParams.get('dates') === key));
    }
    const perCompetition = requests.filter(url => !url.includes('/all/'));
    assert.deepEqual(perCompetition.map(url => new URL(url).searchParams.get('dates')), failDay ? [failDay] : []);
}

// Render the real agenda with an empty competition selection result.
// Historical tabs must have a real section, rather than jumping to today.
for (const sport of ['voetbal', 'darts', 'f1', 'motogp', 'handbal', null]) {
    const container = { innerHTML: '', classList: { add() {} } };
    const status = { innerHTML: '' };
    const callbacks = [];
    let dates = [];
    let scrollTarget = null;
    const ctx = vm.createContext({
        Date: Clock, console,
        document: { body: { dataset: {} }, getElementById: id => id === 'events-container' ? container : status,
            querySelector: selector => container.innerHTML.includes(selector.match(/data-date="([^"]+)"/)?.[1] || 'missing') ? {} : null },
        CONFIG: { COUNTRY_FLAGS: {} }, currentSportFilter: sport,
        showScores: false, showPast: true, resultsMode: false,
        selectedDate: '2026-10-01', filters: { competitions: ['Europa League'] },
        forceRefreshSports: new Set(), isFootballCacheStale: () => false, startHighlightsRefresh() {}, supportedSports: ['voetbal', 'darts', 'f1', 'motogp', 'handbal'],
        cachedData: { voetbal: [], darts: [], f1: [], motogp: [], handbal: [], highlights: [] },
        footballSourceHealth: { successful: 0, failed: 0 },
        applyFootballFilters: events => events.filter(event => core.matchesFootballFilters(event, { competitions: ['Europa League'] })),
        updateResultsModeControls() {}, showLoading() {}, showError: message => assert.fail(message),
        getStaticDartsEvents: () => [], getStaticMotoGPEvents: () => [], getStaticHandballEvents: () => [], fetchHandballEvents: async () => [],
        fetchPdcDartsSchedule: async () => [], mergeDartsScheduleEvents: () => [],
        sanitizeFootballMatches: events => events, filterReliableFootballMatches: events => events,
        countUpcomingFootballMatches: () => 0, setWorldCupHighlights() {},
        generateDateTabs: value => { dates = value; },
        syncGuideDate() {}, setupScrollSync() {}, setupDartsAccordion() {},
        isSameDay: (a, b) => a.toDateString() === b.toDateString(), formatDate: d => d.toDateString(),
        setTimeout: fn => { callbacks.push(fn); },
        scrollToDate: key => { scrollTarget = key; }, scrollToTodayOrNearest: () => { scrollTarget = 'today'; }
    });
    vm.runInContext(dateHelpers + renderer, ctx);
    await vm.runInContext('renderEvents()', ctx);
    for (const key of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']) {
        assert.ok(dates.includes(key), `${sport}: tab ${key}`);
        assert.ok(container.innerHTML.includes(`data-date="${key}"`), `${sport}: section ${key}`);
    }
    if (sport === 'voetbal') assert.match(container.innerHTML, /Geen wedstrijden in je filters/);
    callbacks.forEach(fn => fn());
    assert.equal(scrollTarget, '2026-10-01', `${sport}: refresh should retain selected date`);
    ctx.selectedDate = null;
    vm.runInContext('scrollToSelectedDateOrToday()', ctx);
    assert.equal(scrollTarget, 'today');
}

// Calendar arithmetic must also survive month/year and daylight-saving boundaries.
for (const [today, first] of [
    ['2026-11-01T00:15:00+01:00', '2026-10-29'],
    ['2027-01-01T00:15:00+01:00', '2026-12-29'],
    ['2026-03-30T00:15:00+02:00', '2026-03-27']
]) {
    const ctx = vm.createContext({ Date });
    vm.runInContext(dateHelpers, ctx);
    assert.equal(vm.runInContext(`buildDateRange(new Date('${today}'), 3, 7)[0]`, ctx), first);
}
console.log('Past-day queries, filtered agenda, date retention and calendar boundaries passed.');

