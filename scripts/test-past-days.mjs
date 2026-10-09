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
const fetcher = between('        async function fetchESPNMatches(', '        // Fetch football standings');
const renderer = between('        async function renderEvents(', "        // Scroll to today's section");
class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : ['2026-10-04T00:26:00+02:00'])); }
    static now() { return new Clock().getTime(); }
}

// Exercise both ESPN range queries and the fallback to individual days.
for (const rejectRange of [false, true]) {
    const requests = [];
    const event = {
        date: '2026-10-01T18:00:00Z',
        competitions: [{ competitors: [
            { homeAway: 'home', team: { displayName: 'Ajax' }, score: '2' },
            { homeAway: 'away', team: { displayName: 'Roma' }, score: '1' }
        ], status: { type: { completed: true } } }]
    };
    const ctx = vm.createContext({
        Date: Clock, console: { log() {}, warn() {}, error() {} },
        CONFIG: { ESPN_API_URL: 'https://fixture.test', ESPN_COMPETITIONS: [{ slug: 'uefa.europa', name: 'Europa League', channel: 'Ziggo Sport' }] },
        footballSourceHealth: { successful: 0, failed: 0 },
        shouldIncludeEspnMatch: () => true,
        fetch: async url => {
            requests.push(url);
            const dates = new URL(url).searchParams.get('dates');
            const isRange = dates.includes('-');
            return { ok: !rejectRange || !isRange, status: rejectRange && isRange ? 400 : 200,
                json: async () => ({ events: isRange || dates === '20261001' ? [event] : [] }) };
        }
    });
    vm.runInContext(dateHelpers + fetcher, ctx);
    const matches = await vm.runInContext('fetchESPNMatches()', ctx);
    assert.equal(new URL(requests[0]).searchParams.get('dates'), '20261001-20261011');
    assert.equal(matches.length, 1);
    assert.equal(matches[0].home, 'Ajax');
    assert.equal(matches[0].score, '2-1');
    if (rejectRange) {
        assert.equal(requests.length, 12);
        for (const key of ['20261001', '20261002', '20261003']) {
            assert.ok(requests.some(url => new URL(url).searchParams.get('dates') === key));
        }
    }
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
        forceRefreshSports: new Set(),
        cachedData: { voetbal: [], f1: [], motogp: [], handbal: [], highlights: [] },
        footballSourceHealth: { successful: 0, failed: 0 },
        applyFootballFilters: events => events.filter(event => core.matchesFootballFilters(event, { competitions: ['Europa League'] })),
        updateResultsModeControls() {}, showLoading() {}, showError: message => assert.fail(message),
        getStaticDartsEvents: () => [], getStaticMotoGPEvents: () => [], getStaticHandballEvents: () => [],
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

