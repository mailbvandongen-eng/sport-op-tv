const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const assert = require('node:assert/strict');

const source = fs.readFileSync('release-notes.js', 'utf8');
const currentVersion = source.match(/\{version: '([0-9.]+)'/)[1];
const versionMarker = `version: '${currentVersion}'`;
const futureVersion = currentVersion.replace(/(\d+)$/, (_, patch) => String(Number(patch) + 1));

async function load(storage = {}, version = currentVersion, blocked = false) {
    const dom = new JSDOM('<button id="other">Agenda</button><p class="version-footer"></p>', {
        url: 'https://test.local',
        runScripts: 'outside-only',
        pretendToBeVisual: true
    });
    const window = dom.window;

    for (const [key, value] of Object.entries(storage)) {
        window.localStorage.setItem(key, value);
    }
    if (blocked) {
        window.Storage.prototype.setItem = () => {
            throw new Error('quota');
        };
    }

    window.eval(source.replace(versionMarker, `version: '${version}'`));
    await new Promise(resolve => setTimeout(resolve, 300));
    return dom;
}

(async () => {
    let dom = await load();
    let window = dom.window;
    let document = window.document;
    assert.ok(document.querySelector('[role="dialog"]'), 'new release appears automatically');

    let checkbox = document.querySelector('.release-notes-hide');
    checkbox.checked = true;
    checkbox.dispatchEvent(new window.Event('change'));
    assert.equal(window.localStorage.getItem('sportOpTvHideAutomaticChanges'), 'yes');
    document.querySelector('.release-notes-close').click();
    assert.equal(document.querySelector('[role="dialog"]'), null);
    assert.equal(!!document.querySelector('#other').inert, false);

    const saved = Object.fromEntries(Object.keys(window.localStorage).map(key => [
        key,
        window.localStorage.getItem(key)
    ]));
    window.close();

    dom = await load(saved);
    window = dom.window;
    document = window.document;
    assert.equal(document.querySelector('[role="dialog"]'), null, 'opt-out suppresses this release');
    document.querySelector('.version-footer').click();
    assert.ok(document.querySelector('[role="dialog"]'), 'version link opens release notes');
    checkbox = document.querySelector('.release-notes-hide');
    assert.equal(checkbox.checked, true);
    checkbox.checked = false;
    checkbox.dispatchEvent(new window.Event('change'));
    assert.equal(window.localStorage.getItem('sportOpTvHideAutomaticChanges'), 'no');

    const enabled = Object.fromEntries(Object.keys(window.localStorage).map(key => [
        key,
        window.localStorage.getItem(key)
    ]));
    window.close();

    dom = await load(enabled, futureVersion);
    assert.ok(dom.window.document.querySelector('[role="dialog"]'), 'opt-in shows the next release');
    dom.window.close();

    dom = await load({}, currentVersion, true);
    window = dom.window;
    document = window.document;
    checkbox = document.querySelector('.release-notes-hide');
    checkbox.checked = true;
    checkbox.dispatchEvent(new window.Event('change'));
    assert.equal(document.querySelector('[role="alert"]').hidden, false);
    document.querySelector('.release-notes-close').click();
    document.querySelector('.version-footer').click();
    assert.equal(document.querySelector('.release-notes-hide').checked, true);
    window.close();

    console.log('Release choice: auto-show, persisted opt-out, manual opening, opt-in and blocked storage passed.');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
