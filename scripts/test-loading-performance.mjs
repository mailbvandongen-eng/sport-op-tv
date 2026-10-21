import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const policy = require('../football-policy.js');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const releases = fs.readFileSync(new URL('../release-notes.js', import.meta.url), 'utf8');
const inlineScript = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/)?.[1];
assert.ok(inlineScript, 'Inline app script is missing');
new vm.Script(inlineScript, { filename: 'index.html:inline-script' });

assert.match(inlineScript, /const loadFootball = loadAllSports \|\| currentSportFilter === 'voetbal';/);
assert.match(inlineScript, /loadDarts \? fetchPdcDartsSchedule/);
assert.match(inlineScript, /if \(!currentSportFilter \|\| currentSportFilter === 'darts'\)\s*\{\s*await ensureDartsResultsLoaded/);
assert.match(inlineScript, /Using stale football cache while scheduling a background refresh/);
assert.match(inlineScript, /const renderGeneration = \+\+renderEventsGeneration;/);
assert.match(inlineScript, /if \(renderGeneration !== renderEventsGeneration\) return;/);
assert.match(releases, /version: '3\.16\.1'/);
assert.match(html, /release-notes\.js\?v=3\.16\.1/);
assert.doesNotMatch(releases, /renderEvents\(\)/, 'Release notes must not start a second agenda load on page open');

const footballLoaderStart = inlineScript.indexOf('        async function fetchFootballMatches(options = {}) {');
const footballLoaderEnd = inlineScript.indexOf('        function refreshStaleFootballDataInBackground()', footballLoaderStart);
assert.ok(footballLoaderStart >= 0 && footballLoaderEnd > footballLoaderStart, 'Could not isolate the football loader');
const footballLoader = inlineScript.slice(footballLoaderStart, footballLoaderEnd);
const cachedMatch = { home: 'Ajax', away: 'PSV' };
const staleStorage = new Map([
    ['footballCache', JSON.stringify([cachedMatch])],
    ['footballCacheTime', String(Date.now() - 2 * 60 * 60 * 1000)]
]);
let footballNetworkCalls = 0;
const footballContext = vm.createContext({
    CONFIG: {},
    footballBackgroundRefreshQueued: false,
    footballBackgroundRefreshPromise: null,
    footballSourceHealth: { successful: 0, failed: 0, updatedAt: null, fromCache: false },
    localStorage: {
        getItem: key => staleStorage.get(key) || null,
        setItem: (key, value) => staleStorage.set(key, String(value))
    },
    normalizeFootballData: matches => matches,
    normalizeFootballMatchChannel: match => match,
    restoreFootballSourceHealth() {},
    console: { log() {}, warn() {} },
    fetch: async () => { footballNetworkCalls += 1; throw new Error('Stale cache should not wait for network'); }
});
vm.runInContext(`${footballLoader}\nglobalThis.__footballPromise = fetchFootballMatches();`, footballContext);
const immediatelyAvailable = await footballContext.__footballPromise;
assert.equal(immediatelyAvailable.length, 1);
assert.equal(footballContext.footballBackgroundRefreshQueued, true);
assert.equal(footballNetworkCalls, 0, 'Stale cached fixtures must return before a network request');

const fetchStart = inlineScript.indexOf('        async function fetchESPNMatches() {');
const fetchEnd = inlineScript.indexOf('        // Get static darts events', fetchStart);
assert.ok(fetchStart >= 0 && fetchEnd > fetchStart, 'Could not isolate the ESPN loader');
const espnLoader = inlineScript.slice(fetchStart, fetchEnd);
assert.match(espnLoader, /dayKeys\.map\(async dateKey => \{\s*const response = await fetchEspnWithLimit/);

async function runEspnLoader() {
    let active = 0;
    let peak = 0;
    let requestCount = 0;
    let missingTimeout = false;
    const context = vm.createContext({
        CONFIG: { ESPN_API_URL: 'https://espn.test', ESPN_COMPETITIONS: policy.ESPN_COMPETITIONS },
        footballSourceHealth: { successful: 0, failed: 0 },
        AbortSignal,
        buildDateRange: () => ['2026-10-20', '2026-10-21'],
        shouldIncludeEspnMatch: () => false,
        footballAmsterdamTime: () => '12:00',
        console: { log() {}, warn() {}, error() {} },
        fetch: async (url, options = {}) => {
            active += 1;
            requestCount += 1;
            if (!(options.signal instanceof AbortSignal)) missingTimeout = true;
            peak = Math.max(peak, active);
            await new Promise(resolve => setTimeout(resolve, 8));
            active -= 1;
            return {
                ok: true,
                status: 200,
                json: async () => ({ events: [] })
            };
        }
    });
    vm.runInContext(`${espnLoader}\nglobalThis.__espnPromise = fetchESPNMatches();`, context);
    await context.__espnPromise;
    assert.ok(peak > 1, 'ESPN requests are still serial');
    assert.ok(peak <= 6, `ESPN request limit exceeded: ${peak}`);
    assert.equal(missingTimeout, false, 'ESPN requests must have a timeout signal');
    assert.equal(context.footballSourceHealth.successful, policy.ESPN_COMPETITIONS.length);
    return { peak, requestCount };
}

const standard = await runEspnLoader();
assert.equal(standard.requestCount, policy.ESPN_COMPETITIONS.length);

console.log('Loading performance: lazy source guards, stale-cache path, single startup render, and ESPN concurrency limit passed.');
