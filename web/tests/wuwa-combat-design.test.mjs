import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import React,{act} from 'react';
import {renderToString} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import snapshot from '../content/wuwa-reference.json' with {type:'json'};
registerHooks({resolve(s,c,next){if(s==='@/app/api/wuwa/library/route')return {url:'test:combat-read',shortCircuit:true};if(s==='next/navigation')return {url:'test:combat-navigation',shortCircuit:true};return next(s,c);},load(url,c,next){if(url==='test:combat-read')return {format:'module',source:'export const GET=r=>globalThis.__combatRead(r)',shortCircuit:true};if(url==='test:combat-navigation')return {format:'module',source:'export function notFound(){const e=Error("NOT_FOUND");e.status=404;throw e}',shortCircuit:true};return next(url,c);}});
const {default:Combat}=await import('../components/wuwa-combat.tsx');
const {combatIcon,combatEnemyImage}=await import('../lib/wuwa-combat-artwork.ts');
const {default:Page,generateMetadata}=await import('../app/[locale]/games/[gameId]/combat/page.tsx');
const {combatModes,combatPath}=await import('../lib/wuwa-combat.ts');
const {default:sitemap}=await import('../app/sitemap.ts');
const {catalogLocation}=await import('../lib/catalog-paths.ts');
const props=(locale='ko',mode,gameId='wuwa')=>({params:Promise.resolve({locale,gameId}),searchParams:Promise.resolve({mode})});

test('four-language combat documents preserve exact floor/enemy/effect identities with native source images',()=>{
 const before=structuredClone(snapshot);
 for(const locale of ['ko','en','ja','zh'])for(const mode of Object.keys(combatModes)){
  const dom=new JSDOM(renderToString(React.createElement(Combat,{data:snapshot,locale,date:'2026-10-26',initialMode:mode}))),d=dom.window.document;
  const id=mode==='tower-of-adversity'?'tower-of-adversity:41':mode==='whimpering-wastes'?'whimpering-wastes:23':'endstate-matrix:8',cycle=snapshot.cycles.find(c=>c.id===id),floors=[...d.querySelectorAll('.combat-floor-card')];
  assert.equal(floors.length,cycle.floors.length);
  for(const [i,f]of cycle.floors.entries()){
   assert.deepEqual([...floors[i].querySelectorAll('.combat-enemy-caption>strong')].map(x=>x.textContent),f.enemies.map(e=>e.name[locale]));
   assert.deepEqual([...floors[i].querySelectorAll('.reference-enemy-icon')].map(x=>x.getAttribute('src')),f.enemies.filter(e=>e.icon).map(combatEnemyImage));
   assert.deepEqual([...floors[i].querySelectorAll('.combat-effect p')].map(x=>x.textContent),f.buffs.map(b=>b.text[locale]));
   assert.deepEqual([...floors[i].querySelectorAll('.combat-effect>img')].map(x=>x.getAttribute('src')),f.buffs.filter(b=>b.icon).map(b=>combatIcon(b.icon)));
  }
  for(const image of d.querySelectorAll('img')){assert.equal(image.getAttribute('loading'),'lazy');assert.equal(image.getAttribute('decoding'),'async');}
  for(const a of d.querySelectorAll('.combat-area-nav a'))assert.ok(d.getElementById(a.getAttribute('href').slice(1)));
  if(mode==='endstate-matrix'){assert.equal(d.querySelectorAll('.reference-period time').length,0);assert.equal(d.querySelector('.reference-cycle-state').textContent,{ko:'수록 회차',en:'Data occurrence',ja:'収録回',zh:'收录期次'}[locale]);}
  assert.doesNotMatch(d.querySelector('.reference-community-sources').textContent,/\d+%/);dom.window.close();
 }
 assert.deepEqual(snapshot,before);
});

test('mode/cycle and independent effect disclosures stay interactive without new data fetches',async()=>{
 const props={data:snapshot,locale:'ko',date:'2026-10-26'},dom=new JSDOM('<div id="root">'+renderToString(React.createElement(Combat,props))+'</div>',{url:'https://gagether.wiki/ko/games/wuwa/combat',pretendToBeVisual:true}),saved=new Map();
 const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};for(const k of ['window','document','HTMLElement','Event','MouseEvent','Element','Node'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);let reads=0;set('fetch',()=>{reads++;throw Error('Unexpected combat read');});const {hydrateRoot}=await import('react-dom/client');let root;
 try{
  await act(async()=>{root=hydrateRoot(document.getElementById('root'),React.createElement(Combat,props));});
  await act(async()=>{document.querySelector('.combat-effects-toggle').click();await new Promise(setImmediate);});assert.equal(document.querySelectorAll('.reference-floor-effects[open]').length,12);
  await act(async()=>{document.querySelector('.combat-effects-toggle').click();await new Promise(setImmediate);});assert.equal(document.querySelectorAll('.reference-floor-effects[open]').length,0);
  await act(async()=>{const d=document.querySelector('.reference-floor-effects');d.open=true;d.dispatchEvent(new Event('toggle'));});assert.equal(document.querySelectorAll('.reference-floor-effects[open]').length,1);
  await act(async()=>{const s=document.querySelector('.reference-cycle-controls select');s.value='tower-of-adversity:42';s.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(document.querySelector('.reference-cycle-state').textContent,'예정');assert.equal(document.querySelectorAll('.reference-floor-effects[open]').length,0);
  await act(async()=>document.querySelector('.reference-mode-tabs button:nth-child(3)').click());assert.equal(document.querySelectorAll('.combat-floor-card').length,2);assert.equal(document.querySelectorAll('.reference-period time').length,0);assert.equal(document.querySelectorAll('.combat-wave-label').length,19);assert.equal(reads,0);
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}}
});

test('combat is crawlable at stable localized addresses, with scoped cached SSR and real failure responses',async()=>{
 const requests=[];globalThis.__combatRead=async r=>{requests.push(new URL(r.url));return Response.json({data:snapshot,view:'combat',revision:'source1'},{headers:{'X-Gagether-Roster-Revision':'source1'}});};
 for(const locale of ['ko','en','ja','zh'])for(const mode of Object.keys(combatModes)){
  const document=await Page(props(locale,mode)),dom=new JSDOM(renderToString(document)),links=[...dom.window.document.querySelectorAll('.combat-mode-cards a')];assert.equal(links.length,3);assert.deepEqual(links.map(a=>a.getAttribute('href')),Object.keys(combatModes).map(m=>combatPath(locale,m)));dom.window.close();
  const meta=await generateMetadata(props(locale,mode)),url='https://gagether.wiki'+combatPath(locale,mode);assert.equal(meta.alternates.canonical,url);assert.ok(sitemap().some(p=>p.url===url));assert.equal(meta.alternates.languages[locale],url);assert.equal(catalogLocation(new URL(url).pathname).locale,locale);assert.equal(meta.keywords,undefined);
 }
 const hsrMeta=await generateMetadata(props('en',undefined,'hsr'));assert.equal(hsrMeta.alternates.canonical,'https://gagether.wiki/en/games/hsr/combat');
 assert.equal(requests.length,12);for(const r of requests)assert.equal(r.pathname+r.search,'/api/wuwa/library?view=combat');
 for(const p of [props('xx'),props('en','bad'),props('en',undefined,'unknown')])await assert.rejects(Page(p),e=>e.status===404);assert.equal(requests.length,12);
 globalThis.__combatRead=async()=>Response.json({error:'Unavailable'},{status:503});await assert.rejects(Page(props()),/Saved combat reference unavailable/);
 globalThis.__combatRead=async()=>Response.json({data:snapshot,view:'directory'});await assert.rejects(Page(props()),/scope mismatch/);
});

test('already failed cached combat portraits hydrate to the existing fallback without leaving broken images',async()=>{
 const props={data:snapshot,locale:'ko',date:'2026-10-28'},dom=new JSDOM('<div id="root">'+renderToString(React.createElement(Combat,props))+'</div>',{url:'https://gagether.wiki/ko/games/wuwa/combat',pretendToBeVisual:true}),saved=new Map();
 const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};for(const k of ['window','document','HTMLElement','Event','MouseEvent','Element','Node'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);Object.defineProperty(dom.window.HTMLImageElement.prototype,'complete',{get:()=>true,configurable:true});Object.defineProperty(dom.window.HTMLImageElement.prototype,'naturalWidth',{get:()=>0,configurable:true});let reads=0;set('fetch',()=>{reads++;throw Error('No new source fetch');});const {hydrateRoot}=await import('react-dom/client');let root;
 try{await act(async()=>{root=hydrateRoot(document.getElementById('root'),React.createElement(Combat,props));await new Promise(setImmediate);});assert.equal(document.querySelectorAll('.combat-mode-portraits img').length,0);assert.ok(document.querySelectorAll('.combat-mode-fallback').length>0);assert.equal(reads,0);}finally{await act(async()=>root?.unmount());for(const[k,d]of saved)if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];dom.window.close();}
});
