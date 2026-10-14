// Official EHF men's Champions League only. Retain the previous snapshot on failure.
const fs = require('node:fs');
const path = require('node:path');
const BASE = 'https://ehfcl.eurohandball.com';
const COMPETITION = '-Gd1tlJGDXtuVGsp4I0Chg';
function normalize(matches) {
  const unique = new Map();
  for (const m of matches) {
    if (m.comp?.id !== COMPETITION || m.comp?.gender !== 'M') continue;
    const d = m.venue?.date;
    const home = m.homeTeam?.team?.name, away = m.guestTeam?.team?.name;
    if (!m.matchID || !home || !away || !d?.hasDate) continue;
    const utc = d.hasTime && Number.isFinite(Date.parse(d.utc)) ? d.utc : null;
    const parts = utc ? new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(utc)) : [];
    const p = Object.fromEntries(parts.map(p=>[p.type,p.value]));
    const date = utc ? `${p.year}-${p.month}-${p.day}` : d.cet?.slice(0,10);
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(date || '')) continue;
    unique.set(m.matchID, {id:m.matchID,date,utc,time:utc?`${p.hour}:${p.minute}`:'TBD',event:`${home} vs ${away}`,home,away,competition:'EHF Champions League Men',location:m.venue?.place?.cityName||'',channel:'EHFTV',source:'EHF confirmed',completed:!!m.isFinished});
  }
  return [...unique.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
}
async function collect() {
  const html = await fetchText(BASE+'/men/2026-27/matches/');
  const contentId = html.match(/data-currentcontentid="(\d+)"/)?.[1];
  const competitionId = html.match(/data-competition-id="([^"]+)"/)?.[1];
  if (!contentId || competitionId !== COMPETITION) throw Error('Unexpected EHF competition');
  async function page(endpoint, extra={}) {
    const url = new URL(BASE+'/umbraco/api/competitionmatchesapi/'+endpoint);
    url.search = new URLSearchParams({contentId,competitionId,...extra});
    return JSON.parse(await fetchText(url));
  }
  const first = await page('GetInitMatches');
  if (!Array.isArray(first.matches) || !first.matches.length) throw Error('Empty EHF schedule');
  const all = [...first.matches];
  for (const future of [true,false]) {
    let current = first;
    for (let i=0; current[future?'hasFutureMatches':'hasPastMatches']; i++) {
      if (i>=40) throw Error('EHF pagination limit');
      const edge = future ? current.matches[0] : current.matches.at(-1);
      const next = await page('GetMatches',{matchId:edge.matchID,futureMatches:String(future)});
      if (!next.matches?.length || next.matches.every(m=>all.some(a=>a.matchID===m.matchID))) throw Error('EHF pagination stalled');
      all.push(...next.matches); current=next;
    }
  }
  const matches=normalize(all);
  if (matches.length < 12) throw Error('Incomplete EHF schedule');
  return {schema:1,competition:'EHF Champions League Men',sourceUrl:BASE+'/men/2026-27/matches/',fetchedAt:new Date().toISOString(),matches};
}
async function fetchText(url) {
  const r=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!r.ok) throw Error('EHF HTTP '+r.status);
  return r.text();
}
module.exports={normalize,collect,COMPETITION};
if(require.main===module) collect().then(data=>fs.writeFileSync(path.join(__dirname,'../data/handball-men.json'),JSON.stringify(data,null,2)+'\n')).catch(e=>{console.error(e.message);process.exitCode=1;});
