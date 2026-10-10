const {JSDOM, ResourceLoader, VirtualConsole}=require('jsdom');
process.env.TZ='Europe/Amsterdam';
const fs=require('fs'), assert=require('assert/strict');
const root=require('path').resolve(__dirname,'..');
const requests=[], errors=[];
const today=new Date(); today.setHours(12,0,0,0);
const date=today.toISOString();
const legacyDate=new Date(today); legacyDate.setHours(17,30,0,0);
const espnDate=new Date(today); espnDate.setHours(18,30,0,0);
const fixtures=[
{home:'Manchester United',away:'Tottenham Hotspur',competition:'Premier League',channel:'Viaplay',date:legacyDate.toISOString(),time:'17:30'},
{home:'Man United',away:'Spurs',competition:'Premier League',channel:'Viaplay',date:espnDate.toISOString(),time:'18:30',source:'ESPN'}
];
const competitions=['Premier League',...Array.from({length:28},(_,i)=>`Competitie ${i}`)];
class Local extends ResourceLoader {
fetch(url){const name=new URL(url).pathname.split('/').pop();if(['football-policy.js','search-enhancements.js','release-notes.js','search-ui.css','guide-ui.css','standings-config.js','standings-menu.js','standings-menu.css'].includes(name))return Promise.resolve(Buffer.from(fs.readFileSync(`${root}/${name}`)));return null;}
}
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(`${root}/index.html`,'utf8'),{url:'https://test.sport.local/',runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.IntersectionObserver=class{observe(){}disconnect(){}};
w.fetch=async url=>{requests.push(String(url));return{ok:true,json:async()=>String(url).includes('openf1')?[]:String(url).includes('nos-highlights')?{highlights:[]}:{data:[],events:[],matches:[]}};};
w.localStorage.setItem('cacheVersion','3.12.8');w.localStorage.setItem('sportOpTvSeenRelease','3.15.0');
w.localStorage.setItem('selectedCompetitions',JSON.stringify(competitions));
w.localStorage.setItem('selectedFootballTeams',JSON.stringify(['club:manchester united:mannen']));
w.localStorage.setItem('sportOpTvFootballPreferences',JSON.stringify({teams:[],competitions}));
w.localStorage.setItem('footballCache',JSON.stringify(fixtures));w.localStorage.setItem('footballCacheTime',String(Date.now()));
}});
const w=dom.window,d=w.document,$=s=>d.querySelector(s);
const settle=()=>new Promise(resolve=>setTimeout(resolve,80));
const click=s=>{assert.ok($(s),s);$(s).click();};
const input=(s,value)=>{$(s).value=value;$(s).dispatchEvent(new w.Event('input',{bubbles:true}));};
const visibleRows=()=>[...d.querySelectorAll('.football-slot-match')].filter(row=>!row.hidden);
(async()=>{
await new Promise(resolve=>w.addEventListener('load',resolve));await settle();
assert.equal(visibleRows().length,1,'Old cached aliases must render once');
assert.ok(visibleRows()[0].textContent.includes('18:30'));
assert.ok(visibleRows()[0].textContent.includes('Manchester United'));
assert.ok(visibleRows()[0].textContent.includes('Tottenham Hotspur'));
assert.equal(JSON.parse(w.localStorage.getItem('footballCache')).length,1,'Cache repaired on read');
assert.ok($('#active-filters').textContent.includes('29 competities'));
for(let i=0;i<3;i++) {
  click('#competition-filter-btn');assert.equal($('.filter-backdrop').hidden,false);
  assert.equal($('.filter-backdrop').tagName,'DIALOG');
  input('.filter-search','man united');assert.equal(d.querySelectorAll('.filter-option input:checked').length,1);
  click('.filter-close');assert.equal($('.filter-backdrop').hidden,true);
  assert.equal(d.activeElement,$('#competition-filter-btn'));
}
click('.filter-remove-team');await settle();assert.equal(w.SPORT_OP_TV_APP.getFootballFilters().teams.length,0);
assert.equal(w.SPORT_OP_TV_APP.getFootballFilters().competitions.length,29);
input('#sport-search','man united');click('.filter-show-all');await settle();
assert.equal($('#sport-search').value,'');assert.equal(w.SPORT_OP_TV_APP.getFootballFilters().competitions.length,0);
assert.equal(JSON.parse(w.localStorage.getItem('sportOpTvFootballPreferences')).competitions.length,29);
assert.equal(errors.length,0,errors.join('\n'));
console.log('Bob screenshot route passed: legacy cache, one United/Spurs at 18:30, 1 team + 29 competitions, repeated filter open/close, remove team, clear filters/search and preserve preferences.');
w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1;});
