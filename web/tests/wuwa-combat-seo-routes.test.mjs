import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import React,{act} from 'react';
import {renderToString} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import snapshot from '../content/wuwa-reference.json' with {type:'json'};

registerHooks({resolve(s,c,next){
 if(s==='@/app/api/wuwa/library/route')return {url:'test:mode-reference',shortCircuit:true};
 if(s==='next/navigation')return {url:'test:mode-navigation',shortCircuit:true};
 if(s==='./wuwa-records'&&c.parentURL?.endsWith('/components/wuwa-combat.tsx'))return {url:'test:mode-records',shortCircuit:true};
 return next(s,c);
},load(url,c,next){
 if(url==='test:mode-reference')return {format:'module',source:'export const GET=r=>globalThis.__modeReference(r)',shortCircuit:true};
 if(url==='test:mode-navigation')return {format:'module',source:'export function notFound(){const e=Error("NOT_FOUND");e.status=404;throw e}',shortCircuit:true};
 if(url==='test:mode-records')return {format:'module',source:'export default function Records(p){globalThis.__modeRecordProps?.(p);return null}',shortCircuit:true};
 return next(url,c);
}});
const {default:ModePage,generateMetadata:modeMetadata}=await import('../app/[locale]/games/[gameId]/combat/[mode]/page.tsx');
const {default:LegacyPage,generateMetadata:legacyMetadata}=await import('../app/[locale]/games/[gameId]/combat/page.tsx');
const {default:Combat}=await import('../components/wuwa-combat.tsx');
const {combatModes,combatPath}=await import('../lib/wuwa-combat.ts');
const {wuwaCombatCopy}=await import('../lib/wuwa-combat-seo.ts');
const {catalogLocation,catalogLocaleHeaders}=await import('../lib/catalog-paths.ts');
const {default:sitemap}=await import('../app/sitemap.ts');
const locales=['ko','en','ja','zh'],modes=Object.keys(combatModes),origin='https://gagether.wiki';
const props=(locale,mode,query={},gameId='wuwa')=>({params:Promise.resolve({locale,gameId,mode}),searchParams:Promise.resolve(query)});
const readRequests=[];
globalThis.__modeReference=async r=>{readRequests.push(r);return Response.json({data:snapshot,view:'combat',revision:'route-test'},{headers:{'X-Gagether-Roster-Revision':'route-test'}});};

test('all twelve mode documents have localized SSR facts, clean reciprocal canonicals and sitemap entries',async()=>{
 const pages=sitemap();
 for(const locale of locales){
  assert.ok(pages.some(p=>p.url===origin+combatPath(locale)),'hub remains discoverable');
  for(const mode of modes){
   const path=combatPath(locale,mode),meta=await modeMetadata(props(locale,mode)),doc=await ModePage(props(locale,mode)),dom=new JSDOM(renderToString(doc)),d=dom.window.document;
   assert.equal(path,`/${locale}/games/wuwa/combat/${mode}`);
   assert.equal(meta.alternates.canonical,origin+path);
   assert.equal(meta.robots.index,true);
   assert.equal(d.querySelector('h1').textContent,wuwaCombatCopy(locale,mode).heading);
   assert.ok(d.querySelector('.reference-heading').textContent.includes(wuwaCombatCopy(locale,mode).description));
   assert.equal(d.querySelector('.combat-board').dataset.mode,mode);
   assert.equal(d.querySelectorAll('.combat-mode-cards a').length,3);
   assert.ok(d.querySelectorAll('.combat-floor-card').length>0,'real saved stage information is server readable');
   assert.ok(d.querySelector('.combat-records-intro').textContent.length>100,'submission denominator and privacy context is readable');
   const schema=JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent);
   assert.equal(schema['@graph'][0].url,origin+path);assert.equal(schema['@graph'][0].inLanguage,locale);
   assert.equal(schema['@graph'][1].itemListElement.at(-1).item,origin+path);
   assert.equal(catalogLocation(path).locale,locale);
   assert.equal(catalogLocaleHeaders(new Request(origin+path,{headers:{'x-gagether-route-locale':'xx'}})).get('x-gagether-route-locale'),locale);
   for(const other of locales){
    const alternative=origin+combatPath(other,mode);
    assert.equal(meta.alternates.languages[other],alternative);
    assert.ok(pages.some(p=>p.url===alternative&&p.alternates.languages[locale]===origin+path));
    assert.equal(d.querySelector(`.document-languages a[hreflang="${other}"]`).getAttribute('href'),combatPath(other,mode));
   }
   dom.window.close();
  }
 }
 for(const request of readRequests){assert.equal(request.method,'GET');assert.equal(request.headers.get('cookie'),null);assert.equal(new URL(request.url).pathname+new URL(request.url).search,'/api/wuwa/library?view=combat');}
 assert.ok(pages.filter(p=>new URL(p.url).pathname.includes('/games/wuwa/combat')).every(p=>!new URL(p.url).search),'mode query duplicates are not in the sitemap');
});

test('legacy query links preserve mode, view and actual cycle while advertising the new canonical',async()=>{
 const query={mode:'tower-of-adversity',view:'statistics',cycle:'tower-of-adversity:42'},legacy=props('ja',undefined,query),modern=props('ja','tower-of-adversity',query);
 assert.equal((await legacyMetadata(legacy)).alternates.canonical,(await modeMetadata(modern)).alternates.canonical);
 const dom=new JSDOM(renderToString(await LegacyPage(legacy))),d=dom.window.document;
 assert.equal(d.querySelector('.combat-board').dataset.mode,'tower-of-adversity');
 assert.equal(d.querySelector('.reference-cycle-controls select option[selected]').value,'tower-of-adversity:42');
 assert.equal(d.querySelectorAll('.wr-main-tabs button')[2].getAttribute('aria-pressed'),'true');
 assert.equal(d.querySelector('.document-languages a[hreflang="zh"]').getAttribute('href'),combatPath('zh','tower-of-adversity',{view:'statistics',cycle:'tower-of-adversity:42'}));
 dom.window.close();
 assert.equal((await modeMetadata(props('en','endstate-matrix',{view:'setups'}))).robots.index,false,'private-workspace query is not an index target');
 const before=readRequests.length;
 for(const p of [props('fr','endstate-matrix'),props('ko','not-a-mode'),props('ko','endstate-matrix',{},'hsr')])await assert.rejects(ModePage(p),e=>e.status===404);
 await assert.rejects(LegacyPage(props('en',undefined,{mode:'not-a-mode'})),e=>e.status===404);
 assert.equal(readRequests.length,before,'invalid route does not read data');
 assert.equal(catalogLocation('/ko/games/wuwa/combat/not-a-mode'),null);
 assert.equal(catalogLocation('/ko/games/hsr/combat/endstate-matrix'),null);
});

test('mode links and cycle/view controls keep the existing record workspace correctly scoped',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:origin+'/ko/games/wuwa/combat/tower-of-adversity?view=statistics&cycle=tower-of-adversity%3A41&keep=x',pretendToBeVisual:true}),saved=new Map(),set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 for(const key of ['window','document','HTMLElement','Event','MouseEvent','Element','Node'])set(key,dom.window[key]);set('IS_REACT_ACT_ENVIRONMENT',true);
 let recordProps;set('__modeRecordProps',p=>{recordProps=p;});set('fetch',()=>{throw Error('Route controls must not perform a data write or identity read');});
 const {createRoot}=await import('react-dom/client');let root;
 try{
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(Combat,{data:snapshot,locale:'ko',date:'2026-10-26',initialMode:'tower-of-adversity',initialView:'statistics',initialCycle:'tower-of-adversity:41',standalone:true}));await new Promise(setImmediate);});
  await act(async()=>{await new Promise(setImmediate);});
  assert.equal(recordProps.mode,'tower-of-adversity');assert.equal(recordProps.cycleId,'tower-of-adversity:41');assert.equal(recordProps.view,'statistics');
  await act(async()=>{const select=document.querySelector('.reference-cycle-controls select');select.value='tower-of-adversity:42';select.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(recordProps.cycleId,'tower-of-adversity:42');assert.equal(new URLSearchParams(window.location.search).get('cycle'),'tower-of-adversity:42');
  for(const a of document.querySelectorAll('.combat-mode-cards a')){const u=new URL(a.href);assert.equal(u.searchParams.get('view'),'statistics');assert.equal(u.searchParams.get('mode'),null);}
  assert.equal(document.querySelector('.combat-mode-cards a:last-child').getAttribute('href'),combatPath('ko','endstate-matrix',{view:'statistics'}));
  await act(async()=>document.querySelector('.wr-main-tabs button').click());
  assert.equal(new URLSearchParams(window.location.search).get('view'),null);assert.equal(new URLSearchParams(window.location.search).get('keep'),'x');
  await act(async()=>{window.history.replaceState(null,'','?view=records&cycle=tower-of-adversity%3A41');window.dispatchEvent(new window.PopStateEvent('popstate'));});
  assert.equal(recordProps.view,'records');assert.equal(recordProps.cycleId,'tower-of-adversity:41');
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,d]of saved)if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}
});
