const {JSDOM, ResourceLoader, VirtualConsole}=require('jsdom');
const fs=require('fs'), assert=require('assert/strict');
const root=require('path').resolve(__dirname,'..');
const requests=[], errors=[];
const today=new Date(); today.setHours(12,0,0,0);
const date=today.toISOString();
const fixtures=[
{home:'Ajax',away:'PSV',competition:'Eredivisie',channel:'ESPN',date,time:'12:00',score:'2-1'},
{home:'Ajax',away:'Roma',competition:'Europa League',channel:'Ziggo Sport',date,time:'12:00',score:'1-0'},
{home:'Nederland',away:'Hongarije',competition:'Nations League',channel:'NPO 1',date,time:'12:00',score:'2-0'},
{home:'Nederland',away:'Hongarije',competition:'WK Kwalificatie Vrouwen',channel:'NPO 3',date,time:'12:00',score:'3-0'}
];
class Local extends ResourceLoader {
fetch(url){const name=new URL(url).pathname.split('/').pop();if(['football-policy.js','search-enhancements.js','release-notes.js','search-ui.css','guide-ui.css','standings-config.js','standings-menu.js','standings-menu.css'].includes(name))return Promise.resolve(Buffer.from(fs.readFileSync(`${root}/${name}`)));return null;}
}
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(`${root}/index.html`,'utf8'),{url:'https://test.sport.local/',runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.IntersectionObserver=class{observe(){}disconnect(){}};
w.fetch=async url=>{requests.push(String(url));return{ok:true,json:async()=>String(url).includes('openf1')?[]:String(url).includes('nos-highlights')?{highlights:[]}:{data:[],events:[],matches:[]}};};
w.localStorage.setItem('cacheVersion','3.12.8');w.localStorage.setItem('sportOpTvSeenRelease','3.15.0');
w.localStorage.setItem('footballCache',JSON.stringify(fixtures));w.localStorage.setItem('footballCacheTime',String(Date.now()));
}});
const w=dom.window,d=w.document,$=s=>d.querySelector(s);
const settle=()=>new Promise(resolve=>setTimeout(resolve,80));
const click=s=>{assert.ok($(s),s);$(s).click();};
const input=(s,value)=>{$(s).value=value;$(s).dispatchEvent(new w.Event('input',{bubbles:true}));};
const visibleRows=()=>[...d.querySelectorAll('.football-slot-match')].filter(row=>!row.hidden);
(async()=>{
await new Promise(resolve=>w.addEventListener('load',resolve));await settle();
assert.equal(visibleRows().length,4);const initialRequests=requests.length;
input('#sport-search','Nederland vrouwen');await settle();
assert.equal(w.SPORT_OP_TV_APP.getSportFilter(),'voetbal');
assert.equal(visibleRows().length,1);assert.ok(visibleRows()[0].textContent.includes('Vrouwen'));
assert.equal(w.getComputedStyle([...d.querySelectorAll('.football-slot-match')].find(r=>r.hidden)).display,'none');
assert.equal($('#competition-filter-btn').hidden,false);
click('#search-clear');assert.equal(visibleRows().length,4);
click('#competition-filter-btn');assert.equal($('.filter-backdrop').hidden,false);
input('.filter-search','Nederland');assert.equal(d.querySelectorAll('.filter-option').length,2);
const women=[...d.querySelectorAll('.filter-option input')].find(n=>n.value==='land:nederland:vrouwen');women.click();
assert.equal(w.SPORT_OP_TV_APP.getFootballFilters().teams.length,0,'Draft must not apply yet');
assert.equal(requests.length,initialRequests);
click('.filter-apply');await settle();assert.equal(visibleRows().length,1);
assert.equal(JSON.parse(w.localStorage.getItem('selectedFootballTeams'))[0],'land:nederland:vrouwen');
assert.ok($('#active-filters').textContent.includes('1 team ·'));
click('#results-toggle');await settle();
assert.equal(w.SPORT_OP_TV_APP.isResultsMode(),true);assert.equal(d.querySelectorAll('.results-row').length,1);
assert.equal(requests.length,initialRequests,'Switch to results must reuse source data');
click('#program-toggle');await settle();assert.equal(visibleRows().length,1);
click('#competition-filter-btn');input('.filter-search','Ajax');$('.filter-option input').click();click('.filter-close');
assert.equal(w.SPORT_OP_TV_APP.getFootballFilters().teams.length,1,'Close discards draft');
click('.filter-show-all');await settle();assert.equal(visibleRows().length,4);
input('#sport-search','doesnotexist');await settle();assert.ok($('#search-empty-state'));await settle();assert.equal(d.querySelectorAll('#search-empty-state').length,1);
click('#search-clear');assert.equal($('#search-empty-state'),null);
click('[data-sport="darts"]');await settle();assert.equal($('#competition-filter-btn').hidden,true);assert.equal(w.getComputedStyle($('#competition-filter-btn')).display,'none');
click('[data-sport="voetbal"]');await settle();click('#competition-filter-btn');
input('.filter-search','Ajax');$('.filter-option input').click();
click('[data-filter-tab="competitions"]');input('.filter-search','Europa League');
const europa=[...d.querySelectorAll('.filter-option input')].find(n=>n.value==='Europa League');europa.click();
click('.filter-apply');await settle();assert.equal(visibleRows().length,1);assert.ok(visibleRows()[0].textContent.includes('Roma'));
// Saved preferences are independent of temporary filters and survive reload.
click('#competition-filter-btn'); click('.filter-save-preferences'); await settle();
const saved = JSON.parse(w.localStorage.getItem('sportOpTvFootballPreferences'));
assert.deepEqual(saved.teams, ['club:ajax:mannen']);
assert.deepEqual(saved.competitions, ['Europa League']);
assert.ok($('#active-filters').textContent.includes('Mijn voorkeuren'));
click('.filter-show-all'); await settle(); assert.equal(visibleRows().length,4);
assert.deepEqual(JSON.parse(w.localStorage.getItem('sportOpTvFootballPreferences')), saved);
click('.filter-chip'); await settle(); assert.equal(visibleRows().length,1);
click('#competition-filter-btn'); click('.filter-reset'); click('.filter-apply'); await settle();
assert.equal(visibleRows().length,4);
assert.deepEqual(JSON.parse(w.localStorage.getItem('sportOpTvFootballPreferences')), saved);
// Native calendar, arrows and today use the same date selection.
assert.equal(d.querySelectorAll('.current-guide-day').length,1);
assert.equal(w.getComputedStyle(d.querySelector('.day-section:not(.current-guide-day)')).display,'none');
input('#sport-search','Ajax'); assert.equal(d.body.dataset.guideSearch,'true');
assert.ok($('#search-summary').textContent.includes('alle dagen')); click('#search-clear');
const initialDate=$('#guide-date').value;
click('#date-prev'); assert.equal(d.querySelectorAll('.current-guide-day').length,1); assert.notEqual($('#guide-date').value,initialDate);
click('#date-next'); assert.equal($('#guide-date').value,initialDate);
click('#date-today'); assert.equal($('#guide-date').value,initialDate);
assert.equal(!!$('.header-section').inert,false);
click('#hamburger-btn'); assert.equal($('#side-menu').inert,false);
assert.equal($('.header-section').inert,true); assert.equal(d.activeElement,$('#close-menu-btn'));
$('#side-menu').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
assert.equal($('#side-menu').inert,true); assert.equal(d.activeElement,$('#hamburger-btn'));
click('#competition-filter-btn'); assert.equal($('.header-section').inert,true);
$('.filter-close').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true}));
assert.equal(d.activeElement,$('.filter-apply'));
click('.filter-close'); assert.equal(!!$('.header-section').inert,false);
assert.equal(d.activeElement,$('#competition-filter-btn'));
// The release dialog must trap focus, restore the page and be announced once.
w.localStorage.removeItem('sportOpTvSeenRelease');
$('.version-footer').click(); assert.ok($('.release-notes-backdrop'));
assert.equal($('.header-section').inert,true);
$('.release-notes-close').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',bubbles:true}));
assert.equal(d.activeElement,$('.release-notes-close'));
click('.release-notes-close'); assert.equal(!!$('.header-section').inert,false);
// Audit structural/ARIA rules; JSDOM has no pixel layout, so contrast is checked from tokens below.
w.eval(require('axe-core').source);
const audit=await w.axe.run(d,{rules:{'color-contrast':{enabled:false}}});
assert.equal(audit.violations.length,0,JSON.stringify(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
function luminance(hex) { const rgb=hex.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4); return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722; }
function contrast(a,b) {const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (values[0]+.05)/(values[1]+.05);}
for (const [fg,bg] of [['526071','ffffff'],['526071','f5f5f5'],['b8c4d4','0f172a'],['b8c4d4','1e293b'],['166534','ffffff'],['86efac','0f172a']]) assert.ok(contrast(fg,bg)>=4.5,`${fg}/${bg}`);
assert.ok(fs.readFileSync(`${root}/index.html`,'utf8').indexOf('guide-ui.css')>fs.readFileSync(`${root}/index.html`,'utf8').indexOf('</style>'));
assert.equal(w.getComputedStyle($('.header-section')).position,'relative');
assert.equal(w.getComputedStyle($('.guide-date-bar')).position,'sticky');
assert.equal(w.getComputedStyle($('#sport-search')).height,'44px');
assert.equal(w.getComputedStyle($('.view-mode')).justifyContent,'flex-start');
assert.equal(w.getComputedStyle($('.view-mode')).gap,'16px');
assert.equal(w.getComputedStyle($('#competition-filter-btn')).color,w.getComputedStyle(d.body).color);
assert.equal(w.getComputedStyle($('#search-clear')).height,'44px');
assert.equal(errors.length,0,errors.join('\n'));
console.log('Guide UI: search/sport scope, draft/apply/cancel, preferences, calendar, menu/filter/release focus, axe structural checks and contrast tokens passed.');
dom.window.close();
})().catch(e=>{console.error(e);dom.window.close();process.exitCode=1;});
