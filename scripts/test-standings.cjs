const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const fs=require('fs'),assert=require('assert/strict'),path=require('path');
const root=path.resolve(__dirname,'..'),core=require('../standings-config.js');
const now=new Date().toISOString();
const football={season:{year:2026,displayName:'2026/27'},children:[{name:'Stand',standings:{entries:[{team:{displayName:'Ajax'},stats:[{name:'rank',value:1},{name:'wins',value:2},{name:'ties',value:0},{name:'losses',value:1},{name:'points',value:6},{name:'gamesPlayed',value:3}]}]}}]};
const f1={MRData:{StandingsTable:{StandingsLists:[{season:'2026',round:'16',DriverStandings:[{position:'1',Driver:{givenName:'Andrea Kimi',familyName:'Antonelli'},Constructors:[{name:'Mercedes'}],points:'320',wins:'8'}],ConstructorStandings:[{position:'1',Constructor:{name:'Mercedes'},points:'550',wins:'9'}]}]}}};
let requests=[],errors=[],fail=false,hold=false,release;
const snapshots={schema:1,items:{'darts-merit':{season:'2026',source:'Darts Rankings',fetchedAt:now,asOf:'October 4, 2026',groups:[{name:'Order of Merit',rows:[{rank:1,name:'Luke Littler',points:3124000}]}]},'wk':{...core.football(football),fetchedAt:now,archived:true,matches:[{home:'Nederland',away:'Engeland',date:'2026-07-01T19:00:00Z',completed:true,round:'semifinals',score:'1 – 0'}]}}};
class Local extends ResourceLoader{fetch(url){let name=new URL(url).pathname.split('/').pop();if(fs.existsSync(path.join(root,name)))return Promise.resolve(Buffer.from(fs.readFileSync(path.join(root,name))));return null;}}
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://sport.test/',runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.IntersectionObserver=class{observe(){}disconnect(){}};
w.localStorage.setItem('sportOpTvSeenRelease','3.15.0');w.localStorage.setItem('cacheVersion','3.12.8');w.localStorage.setItem('sportStandingsFavorites','{broken');
w.localStorage.setItem('selectedCompetitions','["Eredivisie"]');
w.fetch=async url=>{url=String(url);requests.push(url);if(url.includes('standings.json')){if(fail)throw Error('offline');return{ok:true,json:async()=>snapshots};}if(url.includes('/standings?')){if(fail)throw Error('offline');if(hold){hold=false;await new Promise(r=>release=r);}return{ok:true,json:async()=>football};}if(url.includes('jolpi.ca'))return{ok:true,json:async()=>f1};return{ok:true,json:async()=>url.includes('openf1')?[]:{events:[],matches:[],data:[],highlights:[]}};};
}});
const wait=()=>new Promise(r=>setTimeout(r,60));
(async()=>{await new Promise(r=>dom.window.addEventListener('load',r));await wait();const w=dom.window,d=w.document,$=id=>d.getElementById(id),click=id=>$(id).click(),choose=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('change',{bubbles:true}));};
click('hamburger-btn');await wait();assert.equal($('standings-competition').value,'eredivisie');assert.match($('standings-content-menu').textContent,/Ajax/);assert.match($('standings-content-menu').textContent,/2026\/27/);
let field=d.querySelector('[data-standings-name-filter]');field.value='unknown';field.dispatchEvent(new w.Event('input',{bubbles:true}));assert.ok(d.querySelector('tbody tr').hidden);field.value='Ajax';field.dispatchEvent(new w.Event('input',{bubbles:true}));assert.ok(!d.querySelector('tbody tr').hidden);
assert.ok(![...$('standings-competition').options].some(n=>/Bundesliga|Ligue 1/.test(n.textContent)));
click('standings-favorite');assert.deepEqual(JSON.parse(w.localStorage.getItem('sportStandingsFavorites')),['f1-drivers']);
choose('standings-sport-select','f1');await wait();assert.match($('standings-content-menu').textContent,/320/);assert.match($('standings-content-menu').textContent,/na race 16/);
click('close-menu-btn');click('hamburger-btn');await wait();assert.equal($('standings-competition').value,'f1-drivers','Last stand survives menu reopening');
choose('standings-sport-select','darts');await wait();assert.match($('standings-content-menu').textContent,/£3,124,000/);assert.match($('standings-content-menu').textContent,/4 oktober 2026/);
choose('standings-sport-select','voetbal');await wait();choose('standings-competition','wk');await wait();d.querySelector('[data-standings-view="knockout"]').click();assert.match($('standings-content-menu').textContent,/Nederland – Engeland/);assert.match($('standings-content-menu').textContent,/Halve finales/);assert.match($('standings-content-menu').textContent,/Eindstand/);
// Refresh in place cannot erase agenda filters or navigate away.
const oldLocation=w.location.href,oldFilters=w.localStorage.getItem('selectedCompetitions');click('refresh-standings');await wait();assert.equal(w.location.href,oldLocation);assert.equal(w.localStorage.getItem('selectedCompetitions'),oldFilters);assert.equal($('standings-competition').value,'wk');assert.ok(d.querySelector('[data-standings-view="knockout"]').classList.contains('active'));
// A slow football response cannot overwrite a subsequently selected F1 table.
choose('standings-competition','eredivisie');await wait();hold=true;click('refresh-standings');await wait();choose('standings-sport-select','f1');await wait();release();await wait();assert.match($('standings-content-menu').textContent,/Antonelli/);assert.doesNotMatch($('standings-content-menu').textContent,/Ajax/);
// Explicitly label the previous successful data during outages, including old cache.
const old={...core.football(football),fetchedAt:'2026-01-01T00:00:00Z',source:'ESPN'};w.localStorage.setItem('sportStandingsData:eredivisie',JSON.stringify(old));fail=true;choose('standings-sport-select','voetbal');await wait();click('refresh-standings');await wait();assert.match($('standings-content-menu').textContent,/laatst opgehaalde stand/);assert.match($('standings-content-menu').textContent,/Ajax/);
// Invalid data must never become a fabricated zero-point table.
choose('standings-competition','europa');await wait();assert.match($('standings-content-menu').textContent,/Geen betrouwbare stand/);assert.equal($('standings-content-menu').querySelectorAll('tbody tr').length,0);
assert.equal(w.localStorage.getItem('selectedCompetitions'),oldFilters);
w.eval(require('axe-core').source);const audit=await w.axe.run($('side-menu'),{rules:{'color-contrast':{enabled:false}}});assert.equal(audit.violations.length,0,JSON.stringify(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
assert.equal(errors.length,0,errors.join('\n'));console.log('Standings: favorites, persistence, refresh without navigation/filter loss, race protection, stale/offline states, tournament results and accessible menu passed.');dom.window.close();
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'data/standings.json')));for(const item of core.items){const data=snapshot.items[item.id];assert.ok(data.groups?.some(g=>g.rows.length),item.id);assert.ok(Number.isFinite(Date.parse(data.fetchedAt)),item.id);for(const g of data.groups)for(const r of g.rows){assert.ok(r.rank>0&&r.name&&(Number.isFinite(r.points)||item.kind==='finalranking'),item.id);assert.doesNotMatch(r.name,/^(I|II)-\d+$/);}}
assert.ok(snapshot.items['darts-merit'].groups[0].rows[0].points>1000000);assert.ok(snapshot.items['f1-drivers'].groups[0].rows.some(r=>r.points>0));assert.ok(snapshot.items.wk.matches.some(m=>m.round==='final'));
console.log('Standings sources: all configured providers produce valid, dated data; money units and tournament rounds verified.');
})().catch(e=>{console.error(e);dom.window.close();process.exitCode=1;});
