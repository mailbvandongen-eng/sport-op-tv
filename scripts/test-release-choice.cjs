const {JSDOM}=require('jsdom');const fs=require('fs');const assert=require('assert/strict');
const source=fs.readFileSync('release-notes.js','utf8');
async function load(storage={},version='3.16.0',blocked=false){
 const dom=new JSDOM('<button id="other">Agenda</button><p class="version-footer"></p>',{url:'https://test.local',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;
 for(const [k,v] of Object.entries(storage))w.localStorage.setItem(k,v);
 if(blocked)w.Storage.prototype.setItem=()=>{throw Error('quota')};
 w.eval(source.replace("version: '3.16.0'",`version: '${version}'`));await new Promise(r=>setTimeout(r,300));return dom;
}
(async()=>{
 let dom=await load();let w=dom.window,d=w.document;
 assert.ok(d.querySelector('[role=dialog]'));
 let box=d.querySelector('.release-notes-hide');box.checked=true;box.dispatchEvent(new w.Event('change'));assert.equal(w.localStorage.getItem('sportOpTvHideAutomaticChanges'),'yes');
 d.querySelector('.release-notes-close').click();assert.equal(d.querySelector('[role=dialog]'),null);assert.equal(!!d.querySelector('#other').inert,false);
 const saved=Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));dom.window.close();
 dom=await load(saved,'3.16.1');w=dom.window;d=w.document;assert.equal(d.querySelector('[role=dialog]'),null,'future release suppressed');
 d.querySelector('.version-footer').click();assert.ok(d.querySelector('[role=dialog]'));box=d.querySelector('.release-notes-hide');assert.equal(box.checked,true);box.checked=false;box.dispatchEvent(new w.Event('change'));assert.equal(w.localStorage.getItem('sportOpTvHideAutomaticChanges'),'no');
 const enabled=Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));dom.window.close();
 dom=await load(enabled,'3.16.2');assert.ok(dom.window.document.querySelector('[role=dialog]'),'opt-in shows future release');dom.window.close();
 dom=await load({},'3.16.0',true);w=dom.window;d=w.document;box=d.querySelector('.release-notes-hide');box.checked=true;box.dispatchEvent(new w.Event('change'));assert.equal(d.querySelector('[role=alert]').hidden,false);d.querySelector('.release-notes-close').click();d.querySelector('.version-footer').click();assert.equal(d.querySelector('.release-notes-hide').checked,true);dom.window.close();
 console.log('Release choice: default auto-show, persisted opt-out across future releases, manual opening, opt-in, focus restoration and blocked storage passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
