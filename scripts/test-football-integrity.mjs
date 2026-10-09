import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const core=createRequire(import.meta.url)('../search-enhancements.js');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const code=html.slice(html.indexOf('        function getLocalDateKey('),html.indexOf('        function normalizeInternationalTeamName('));
for(const deviceZone of ['UTC','America/New_York','Europe/Amsterdam']) {
  process.env.TZ=deviceZone;
  const ctx=vm.createContext({Intl,Date,window:{SPORT_OP_TV_SEARCH_CORE:core},CONFIG:{OPENFOOTBALL_LEAGUES:[{name:'Premier League',timeZone:'Europe/London'},{name:'Eredivisie',timeZone:'Europe/Amsterdam'}]},normalizeChannelList:x=>x,getPrimaryChannel:x=>x});
  vm.runInContext(code,ctx);
  const convert=(date,time,zone)=>ctx.sourceLocalFootballDate(date,time,zone);
  assert.equal(convert('2026-10-10','17:30','Europe/London').toISOString(),'2026-10-10T16:30:00.000Z');
  assert.equal(convert('2026-10-31','17:30','Europe/London').toISOString(),'2026-10-31T17:30:00.000Z');
  assert.equal(ctx.footballAmsterdamTime(convert('2026-10-10','17:30','Europe/London')),'18:30');
  assert.equal(ctx.footballAmsterdamTime(convert('2026-10-31','17:30','Europe/London')),'18:30');
  assert.equal(ctx.getLocalDateKey('2026-10-09T23:30:00Z'),'2026-10-10');
  const legacy={date:'2026-10-10T15:30:00Z',time:'17:30',home:'Manchester United',away:'Tottenham Hotspur',competition:'Premier League',channel:'Viaplay'};
  const espn={date:'2026-10-10T16:30:00Z',time:'18:30',home:'Man United',away:'Spurs',competition:'Premier League',channel:'Viaplay',source:'ESPN'};
  for(const fixtures of [[legacy,espn],[espn,legacy]]) {
    const repaired=ctx.normalizeFootballData(fixtures);
    assert.equal(repaired.length,1);assert.equal(repaired[0].time,'18:30');
    assert.equal(repaired[0].home,'Manchester United');assert.equal(repaired[0].away,'Tottenham Hotspur');
    assert.equal(repaired[0].source,'ESPN');
    assert.equal(ctx.normalizeFootballData(repaired)[0].time,'18:30');
  }
  assert.equal(ctx.normalizeFootballData([legacy])[0].time,'18:30');
  const clubPair={...espn,home:'Arsenal',away:'Leeds United'};
  assert.equal(ctx.normalizeFootballData([clubPair,{...clubPair,away:'Leeds'}]).length,1);
  // Live all-sports route exposed these exact source pairs after clearing United.
  for (const [competition,home,away,aliasHome,aliasAway] of [
    ['Serie A','Genoa','Fiorentina','Genoa CFC','ACF Fiorentina'],
    ['Serie A','Inter Milan','Parma','FC Internazionale Milano','Parma Calcio 1913'],
    ['Serie A','Napoli','Frosinone','SSC Napoli','Frosinone Calcio'],
    ['Bundesliga','Mainz','Bayer Leverkusen','1. FSV Mainz 05','Bayer 04 Leverkusen'],
    ['Bundesliga','Union Berlin','Elversberg','1. Union Berlin','SV 07 Elversberg'],
    ['Bundesliga','Hoffenheim','Hamburger SV','TSG 1899 Hoffenheim','Hamburg'],
    ['Bundesliga','Paderborn','VfB Stuttgart','SC Paderborn 07','Stuttgart'],
    ['Bundesliga','RB Leipzig','Eintracht Frankfurt','RB Leipzig','Frankfurt'],
    ['Ligue 1','Lille','Le Havre AC','Lille OSC','Le Havre AC'],
    ['Ligue 1','AS Monaco','Toulouse','Monaco','Toulouse'],
    ['Ligue 1','Brest','Angers','Stade Brestois 29','Angers SCO'],
    ['La Liga','FC Barcelona','Getafe','FC Barcelona','Getafe CF'],
    ['La Liga','Real Madrid','Villarreal','Real Madrid','Villarreal CF']
  ]) {
    const first={...espn,competition,home,away};
    assert.equal(ctx.normalizeFootballData([first,{...first,home:aliasHome,away:aliasAway}]).length,1, `${home}–${away}`);
  }
  // Paris FC and PSG, and first team / reserve identities must stay separate.
  assert.notEqual(core.teamInfo('Paris','Ligue 1').value,core.teamInfo('PSG','Ligue 1').value);
  assert.notEqual(core.teamInfo('Ajax','Eredivisie').value,core.teamInfo('Jong Ajax','Eerste Divisie').value);
  assert.equal(ctx.normalizeFootballData([espn,{...espn,competition:"Women's Premier League"}]).length,2);
  assert.equal(ctx.normalizeFootballData([espn,{...espn,home:'Spurs',away:'Man United'}]).length,2);
  assert.equal(ctx.normalizeFootballData([espn,{...espn,date:'2026-10-11T16:30:00Z'}]).length,2);
  const unknown={...legacy,time:'Tijd onbekend'};
  assert.equal(ctx.normalizeFootballData([unknown])[0].time,'Tijd onbekend');
}
console.log('Football integrity: source timezones, DST, device-zone independence, alias dedupe, source priority and idempotent cache repair passed.');
