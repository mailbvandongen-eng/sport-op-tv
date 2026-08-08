import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const inlineScript = source.match(/<script>\s*([\s\S]*?)\s*<\/script>/)?.[1];
assert.ok(inlineScript, 'Inline applicatiescript ontbreekt');
new vm.Script(inlineScript, { filename: 'index.html:inline-script' });

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} ontbreekt in index.html`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Kon ${name} niet volledig lezen`);
}

const context = { console };
vm.createContext(context);
vm.runInContext([
  extractFunction('getEspnRoundText'),
  extractFunction('isAtOrAfterEnglishCupRound')
].join('\n'), context);

const include = context.isAtOrAfterEnglishCupRound;
assert.equal(include('First Round', 3), false);
assert.equal(include('2nd Round', 3), false);
assert.equal(include('Third Round', 3), true);
assert.equal(include('third-round', 3), true);
assert.equal(include('Round 3', 3), true);
assert.equal(include('Fourth Round', 3), true);
assert.equal(include('Round of 16', 3), true);
assert.equal(include('Quarterfinal', 3), true);
assert.equal(include('', 3), false);
assert.equal(include('Regular Season', 3), false);

const roundText = context.getEspnRoundText(
  { season: { type: { name: 'Regular Season' } }, week: { text: 'Third Round' } },
  { notes: [{ headline: 'Carabao Cup' }] }
);
assert.equal(include(roundText, 3), true);

assert.match(source, /eng\.league_cup[^\n]+minimumRound:\s*3/);
for (const clubName of ['NEC', 'NEC Nijmegen', 'N.E.C. Nijmegen', 'FC Utrecht', 'Go Ahead Eagles']) {
  assert.ok(source.includes(`'${clubName}'`), `${clubName} ontbreekt in de Nederlandse clublijst`);
}
assert.doesNotMatch(source, /UEFA European qualifiers for Dutch clubs/);

console.log('Football selection policy: alle controles geslaagd.');
