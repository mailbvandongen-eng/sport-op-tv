// Public standings snapshots: every item retains its own successful fetch time.
const fs=require('fs'),path=require('path');
const {JSDOM,VirtualConsole}=require('jsdom');
const core=require('../standings-config.js');
const file=path.resolve(__dirname,'../data/standings.json');
const doc=html=>new JSDOM(html,{virtualConsole:new VirtualConsole()}).window.document;
const text=n=>n?.textContent.replace(/\s+/g,' ').trim()||'';
async function get(url,json=false){const r=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'Sport-op-TV-standings/1.0'}});if(!r.ok)throw Error(`HTTP ${r.status}`);return json?r.json():r.text();}
function parseHTML(html,item){const d=doc(html);let groups=[],note='',asOf='';
if(item.kind==='finalranking'){
const head=[...d.querySelectorAll('h2,h3,h4')].find(n=>/FINAL RANKING/i.test(text(n)));let section='';for(let n=head?.nextElementSibling;n&&!/^H[1-4]$/.test(n.tagName);n=n.nextElementSibling)section+=' '+text(n);const rows=[...section.matchAll(/(\d+)\.\s*([^\d]+?)(?=,?\s*\d+\.|$)/g)].map(m=>({rank:Number(m[1]),name:m[2].trim().replace(/,$/,''),points:null}));if(rows.length!==32||new Set(rows.map(r=>r.rank)).size!==32)throw Error('Onvolledige eindrangschikking');groups=[{name:'Eindrangschikking',rows}];
}else if(item.kind==='merit'){const rows=[...d.querySelectorAll('#tablesingle tbody tr')].map(tr=>{const c=[...tr.querySelectorAll('td')].map(text);return{rank:Number(c[0]),name:c[1],points:Number(c[2])*1000};}).filter(r=>r.rank>0&&r.name&&Number.isFinite(r.points));groups=[{name:'PDC Order of Merit',rows}];asOf=text(d.body).match(/As of ([A-Za-z]+ \d{1,2}, \d{4})/)?.[1]||'';if(!asOf)throw Error('Peildatum ontbreekt');note='Prijzengeld over twee jaar. Laatst gepubliceerde ranking; geen live prognose.';
}else if(item.kind==='motogp'){const rows=[...d.querySelectorAll('tr.qa_rider_row')].map(tr=>({rank:Number(text(tr.querySelector('.position'))),name:text(tr.querySelector('.rider__name')),team:text(tr.querySelector('.team')),points:Number(text(tr.querySelector('.points')))})).filter(r=>r.rank>0&&r.name&&Number.isFinite(r.points));groups=[{name:'MotoGP',rows}];if(!text(d.body).includes('2026'))throw Error('Onbekend seizoen');
}else if(item.kind==='handball'){for(const table of d.querySelectorAll('table')){const rows=[...table.querySelectorAll(':scope > tbody > tr')].map(tr=>{const c=[...tr.children].filter(n=>n.tagName==='TD');return{rank:parseInt(text(c[0])),name:text(c[0]?.querySelector('a')),played:Number(text(c[1])),wins:Number(text(c[2])),draws:Number(text(c[3])),losses:Number(text(c[4])),diff:Number(text(c[6])),points:Number(text(c[7]))};}).filter(r=>r.rank>0&&r.name&&!/^(I|II)-[0-9]+$/.test(r.name)&&Number.isFinite(r.points));if(rows.length)groups.push({name:text(table.querySelector('th')).replace('GROUP','Groep')||'Groep',rows});}
}else if(item.kind==='darts-league'){for(const table of d.querySelectorAll('table')){const rows=[...table.querySelectorAll('tbody tr')].map(tr=>{const c=[...tr.querySelectorAll('td')].map(text);return{rank:parseInt(c[0]),name:c[1],played:Number(c[2]),wins:Number(c[3]),losses:Number(c[5]),diff:Number(c[6]),points:Number(c[7])};}).filter(r=>r.rank>0&&r.name&&Number.isFinite(r.points));if(rows.length===8){groups=[{name:'Competitiefase',rows}];break;}}note='Eindstand competitiefase 2026; play-offs bepalen de toernooiwinnaar.';
}
if(!groups.some(g=>g.rows.length))throw Error('Geen valide tabel');return{season:item.season||(item.kind==='handball'?'2026/27':'2026'),year:Number(item.season||2026),groups,asOf,note,archived:item.archived||item.kind==='darts-league'};
}
async function collect(item){let result;
if(item.kind==='football'){result=core.football(await get(`https://site.api.espn.com/apis/v2/sports/soccer/${item.slug}/standings?region=nl&lang=nl`,true));if(item.tournament&&result.year){const data=await get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${item.slug}/scoreboard?dates=${result.year}&limit=1000`,true);result.matches=core.matches(data);result.archived=result.matches.length>0&&result.matches.every(e=>e.completed)||result.year<new Date().getFullYear();}}
else if(item.kind==='f1')result=core.f1(await get(item.url,true),item);
else result=parseHTML(await get(item.url),item);
if(!result.groups?.some(g=>g.rows.length))throw Error('Geen valide stand');return{...result,source:item.source,sourceUrl:item.url,fetchedAt:new Date().toISOString()};
}
async function main(){let previous={items:{}};try{previous=JSON.parse(fs.readFileSync(file));}catch{}const output={schema:1,items:{...previous.items}};let failures=0;
// Small batches respect providers and bound total runtime.
for(let i=0;i<core.items.length;i+=4){await Promise.all(core.items.slice(i,i+4).map(async item=>{try{output.items[item.id]=await collect(item);console.log(item.id,output.items[item.id].groups.reduce((n,g)=>n+g.rows.length,0));}catch(e){failures++;console.error(item.id,e.message);output.items[item.id]={...previous.items[item.id],source:item.source,sourceUrl:item.url,error:'Bron tijdelijk niet beschikbaar',attemptedAt:new Date().toISOString()};}}));}
fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(output,null,2)+'\n');if(failures)console.warn(`${failures} bronnen niet bijgewerkt; laatste betrouwbare gegevens behouden.`);
}
module.exports={parseHTML,collect};if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
