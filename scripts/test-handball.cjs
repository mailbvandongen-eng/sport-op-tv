const assert=require('node:assert/strict'), fs=require('node:fs'),vm=require('node:vm');
const {normalize,COMPETITION}=require('./update-handball.cjs');
const fixture=(id,utc,extra={})=>({matchID:id,comp:{id:COMPETITION,gender:'M'},venue:{date:{hasDate:true,hasTime:true,utc},place:{cityName:'Nantes'}},homeTeam:{team:{name:'HBC Nantes'}},guestTeam:{team:{name:'MT Melsungen'}},...extra});
const raw=[fixture('summer','2026-10-14T18:45:00Z'),fixture('winter','2026-11-18T19:45:00Z'),fixture('summer','2026-10-14T18:45:00Z'),fixture('women','2026-10-14T18:45:00Z',{comp:{id:COMPETITION,gender:'F'}}),fixture('other','2026-10-14T18:45:00Z',{comp:{id:'other',gender:'M'}})];
const matches=normalize(raw);assert.equal(matches.length,2);assert.equal(matches[0].time,'20:45');assert.equal(matches[1].time,'20:45');
assert.equal(normalize([fixture('tbd','0001-01-01',{venue:{date:{hasDate:true,hasTime:false,cet:'2026-12-01T00:00:00'}}})])[0].time,'TBD');
const source=fs.readFileSync('index.html','utf8');
const funcs=source.slice(source.indexOf('        function getStaticHandballEvents('),source.indexOf('        function cleanDartsTournamentName('));
const store=new Map();let fail=false;
const context=vm.createContext({Date,console,AbortSignal,handballCalendar:matches,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},getLocalDateKey:d=>d.toISOString().slice(0,10),getStaticEventDate:(d,t)=>new Date(d+'T'+t+':00Z'),isLiveNow:()=>false,fetch:async()=>{if(fail)throw Error('offline');return{ok:true,json:async()=>({schema:1,competition:'EHF Champions League Men',matches})};}});
// Freeze only the current date, leaving parsing intact.
context.Date=class extends Date{constructor(...args){super(...(args.length?args:['2026-10-14T12:00:00Z']));}};
vm.runInContext(funcs,context);
(async()=>{let events=await vm.runInContext('fetchHandballEvents()',context);assert.equal(events.length,1);assert.equal(events[0].title,'HBC Nantes vs MT Melsungen');assert.equal(events[0].date.toISOString(),'2026-10-14T18:45:00.000Z');fail=true;events=await vm.runInContext('fetchHandballEvents()',context);assert.equal(events.length,1);store.clear();events=await vm.runInContext('fetchHandballEvents()',context);assert.equal(events.length,1);assert.match(source,/href="https:\/\/www.ehftv.com\/"/);console.log('Handball: men only, duplicates, summer/winter Dutch time, unknown time, refresh and offline fallback passed.');})().catch(e=>{console.error(e);process.exitCode=1;});
