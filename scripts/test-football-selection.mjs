import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const policy = require('../football-policy.js');
const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const inlineScript = source.match(/<script>\s*([\s\S]*?)\s*<\/script>/)?.[1];
assert.ok(inlineScript, 'Inline applicatiescript ontbreekt');
new vm.Script(inlineScript, { filename: 'index.html:inline-script' });

const includeRound = policy.isAtOrAfterRound;
assert.equal(includeRound('First Round', 3), false);
assert.equal(includeRound('2nd Round', 3), false);
assert.equal(includeRound('Third Round', 3), true);
assert.equal(includeRound('third-round', 3), true);
assert.equal(includeRound('Round 3', 3), true);
assert.equal(includeRound('Fourth Round', 3), true);
assert.equal(includeRound('Round of 16', 3), true);
assert.equal(includeRound('Quarterfinal', 3), true);
assert.equal(includeRound('', 3), false);
assert.equal(includeRound('Regular Season', 3), false);

const roundText = policy.getEspnRoundText(
  { season: { type: { name: 'Regular Season' } }, week: { text: 'Third Round' } },
  { notes: [{ headline: 'Carabao Cup' }] }
);
assert.equal(includeRound(roundText, 3), true);

const carabao = policy.ESPN_COMPETITIONS.find(comp => comp.slug === 'eng.league_cup');
assert.equal(carabao.minimumRound, 3);
const internationalOptions = {
  isDutchNationalTeam: name => /nederland|netherlands/i.test(name),
  isRelevantInternationalMatch: () => true
};
assert.equal(policy.includesMatch(carabao, 'Mansfield Town', 'Sheffield United',
  { season: { slug: 'first-round' } }, {}, internationalOptions), false);
assert.equal(policy.includesMatch(carabao, 'Liverpool', 'Manchester City',
  { season: { slug: 'third-round' } }, {}, internationalOptions), true);

for (const clubName of ['NEC', 'NEC Nijmegen', 'N.E.C. Nijmegen', 'FC Utrecht', 'Go Ahead Eagles']) {
  assert.equal(policy.isDutchClub(clubName), true, `${clubName} wordt niet als Nederlandse club herkend`);
}

for (const slug of ['uefa.champions_qual', 'uefa.europa_qual', 'uefa.europa.conf_qual']) {
  const competition = policy.ESPN_COMPETITIONS.find(comp => comp.slug === slug);
  assert.equal(competition.dutchClubsOnly, true, `${slug} mist het Nederlandse-clubbeleid`);
  assert.equal(policy.includesMatch(competition, 'N.E.C. Nijmegen', 'Olympiacos', {}, {}, internationalOptions), true);
  assert.equal(policy.includesMatch(competition, 'Olympiacos', 'Benfica', {}, {}, internationalOptions), false);
}

assert.match(source, /<script src="football-policy\.js"><\/script>/);
assert.match(source, /ESPN_COMPETITIONS:\s*ISER_FOOTBALL_POLICY\.ESPN_COMPETITIONS/);
assert.doesNotMatch(source, /UEFA European qualifiers for Dutch clubs/);

console.log('Football selection policy: alle controles geslaagd.');
