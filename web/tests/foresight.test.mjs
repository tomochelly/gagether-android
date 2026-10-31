import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
const model=await import('../lib/foresight.ts'),{readForesight}=await import('../lib/foresight-data.ts'),{default:Panel}=await import('../components/foresight-panel.tsx'),api=await import('../app/api/foresight/route.ts');
const now=Date.parse('2026-10-27T00:30:00Z');
test('three server outlooks preserve actual canonical aliases, 23 identities, native provenance and dated uncertainty without schedule timestamps',()=>{
 const counts={bluearchive:8,arknights:9,reverse1999:6};
 for(const [id,count]of Object.entries(counts)){const data=readForesight(id);assert.equal(data.items.length,count);model.foresightSchema.parse(data);assert.ok(data.items.every(i=>i.leading.sources.length));assert.ok(!JSON.stringify(data).includes('oldwell.info'));assert.ok(!JSON.stringify(data).includes('startAt'));assert.ok(!JSON.stringify(data).includes('notificationEligible'));}
 assert.equal(model.canonicalForesightRegion('bluearchive','global'),'kr');assert.equal(model.canonicalForesightRegion('reverse1999','jp'),'global');assert.equal(model.canonicalForesightRegion('arknights','jp'),'jp');assert.equal(readForesight('genshin'),null);
 const ba=model.foresightRows(readForesight('bluearchive'),'global',now);assert.equal(ba[0].timing.kind,'confirmed');assert.equal(ba[0].timing.startDate,'2026-11-03');assert.equal(ba[1].timing.kind,'community');assert.equal(ba[1].timing.startDate,'2026-11-10');
 const reverse=model.foresightRows(readForesight('reverse1999'),'kr',now);assert.equal(reverse[0].timing.kind,'confirmed');assert.match(reverse[0].item.title.ko,/업데이트/);assert.match(reverse[0].timing.scope.ko,/버전 시작/);assert.ok(!reverse.some(r=>r.item.title.ko==='헤도네'&&r.timing.kind==='confirmed'));
});
test('lag estimates derive from actual same-content date pairs, round month ranges outward and never become target release facts after a window expires',()=>{
 const data=readForesight('arknights'),rows=model.foresightRows(data,'kr',now),last=rows.find(r=>r.item.id==='arknights-cn-thankyou-2026');assert.deepEqual(model.foresightLag(data.pairs),{min:156,max:166,median:164,count:3});
 assert.equal(last.item.leading.startDate,'2026-11-01');assert.equal(last.timing.startDate,'2027-04-01');assert.equal(last.timing.endDate,'2027-04-30');assert.equal(last.timing.kind,'lag');
 const elapsed=model.foresightRows(data,'global',Date.parse('2027-05-02T00:00:00Z'));assert.ok(elapsed.every(r=>r.elapsed));assert.ok(elapsed.every(r=>r.timing.kind==='lag'));
 assert.equal(model.foresightRows(readForesight('reverse1999'),'global',Date.parse('2026-11-06T00:00:00Z')).find(r=>r.timing.kind==='confirmed').elapsed,true);
 const reverse=readForesight('reverse1999'),v41=model.foresightRows(reverse,'jp',now).find(r=>r.item.id.endsWith('41-version'));assert.equal(v41.timing.startDate,'2027-01-28');assert.equal(v41.timing.endDate,'2027-02-18');
});
test('invalid days, foreign target servers, ordinary calendar fields and unsupported official date promotions fail closed',()=>{
 const base=readForesight('bluearchive');
 for(const change of [d=>d.items[0].leading.startDate='2026-02-30',d=>d.items[0].targets[0].regions=['jp'],d=>d.items[0].targets[0].sources=d.items[0].targets[0].sources.map(s=>({...s,kind:'community'})),d=>d.items[0].startAt='2026-11-03T00:00:00Z',d=>d.items[0].targets[0].kind='lag']){const bad=structuredClone(base);change(bad);assert.equal(model.foresightSchema.safeParse(bad).success,false);}
});
test('all four SSR languages show regional evidence and correct following-server labels; Simple mode keeps future artwork unmounted',()=>{
 for(const gameId of model.foresightGames)for(const locale of ['ko','en','ja','zh']){
  const data=readForesight(gameId),html=renderToStaticMarkup(React.createElement(Panel,{gameId,locale,initialData:data,region:'kr',now})),dom=new JSDOM(html),d=dom.window.document;
  assert.equal(d.querySelectorAll('.foresight-card').length,data.items.length);assert.ok([...d.querySelectorAll('.foresight-members a')].every(a=>a.textContent.trim()));assert.ok(d.querySelector('.foresight-heading h1').textContent.includes(model.foresightTabs[locale]));assert.equal(d.querySelector('[role=status]'),null);
  assert.ok([...d.querySelectorAll('.foresight-members a')].every(a=>a.getAttribute('href').endsWith('?region='+data.leadingRegion)));
  assert.ok(!d.querySelector('script[type="application/ld+json"]'));assert.ok([...d.querySelectorAll('.foresight-sources')].every(e=>!e.open));dom.window.close();
  const simple=new JSDOM(renderToStaticMarkup(React.createElement(Panel,{gameId,locale,initialData:data,region:'kr',now,simpleMode:true})));assert.equal(simple.window.document.querySelectorAll('.foresight-portraits img').length,0);simple.window.close();
 }
});
test('read-only outlook API validates game scope and explicitly excludes ordinary calendar and notifications',async()=>{
 assert.equal((await api.GET(new Request('https://gagether.wiki/api/foresight?game=genshin'))).status,404);assert.equal(api.POST,undefined);
 for(const game of model.foresightGames){const response=await api.GET(new Request('https://gagether.wiki/api/foresight?game='+game));assert.equal(response.status,200);const body=await response.json();assert.equal(body.data.gameId,game);assert.deepEqual(body.excludedFrom,['calendar','notifications','official-notices']);}
});
test('mounted target/filter and language changes preserve explicit server choices and never fetch ordinary schedule data',async()=>{
 const data=readForesight('arknights'),dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/ko/games/arknights/foresight',pretendToBeVisual:true}),old=new Map();
 const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};for(const k of ['window','document','HTMLElement','Element','Node','Event'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);set('fetch',async()=>{throw Error('No fetch expected for an SSR snapshot')});
 const {createRoot}=await import('react-dom/client');let root;const render=locale=>React.createElement(Panel,{gameId:'arknights',locale,initialData:data,now,showLanguageLinks:true});
 try{await act(async()=>{root=createRoot(document.getElementById('root'));root.render(render('ko'));});assert.equal(document.querySelectorAll('.foresight-card').length,9);
  const select=document.querySelector('.foresight-server-flow select');await act(async()=>{select.value='jp';select.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(new URL(window.location.href).searchParams.get('region'),'jp');
  await act(async()=>root.render(render('en')));assert.equal(document.querySelector('.foresight-server-flow select').value,'jp');assert.ok([...document.querySelectorAll('.document-languages a')].every(a=>a.search==='?region=jp'));
  const filter=document.querySelector('.foresight-toolbar>select');await act(async()=>{filter.value='confirmed';filter.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(document.querySelectorAll('.foresight-card').length,0);assert.ok(document.querySelector('.foresight-list').textContent.includes('No matching'));
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of old)v?Object.defineProperty(globalThis,k,v):delete globalThis[k];}
});
