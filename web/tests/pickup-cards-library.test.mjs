import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
const {pickupCards}=await import('../lib/pickup-cards.ts');
const {PickupSection}=await import('../components/radar.tsx');
const {LibraryGameMeta}=await import('../components/event-overview.tsx');
const {CatalogContext}=await import('../components/catalog-context.tsx');
const {catalogGames,catalogUi}=await import('../lib/editorial.ts');
const {gameBroadcasts}=await import('../lib/broadcast-visibility.ts');
const {contentLanguage}=await import('../lib/content-audience.ts');
const {effectiveRegion}=await import('../lib/presentation.ts');
const {artworkAudit}=await import('../lib/artwork-audit.ts');
const games=catalogGames({}),byId=Object.fromEntries(games.map(g=>[g.id,g]));
const loc=s=>({ko:s,en:s,ja:s,zh:s}),now=Date.parse('2026-10-23T01:00:00Z');
const member=(name,type='rerun',role='featured')=>({name:loc(name),type,role,image:'/assets/'+name+'.png',imageVerified:true,imageLocale:'neutral',imageKind:'banner'});
const entry={id:'rotation',gameId:'zzz',region:'global',kind:'pickup',title:loc('3.3 · Phase 1'),summary:loc('Official rotation'),startAt:'2026-10-22T02:00:00Z',endAt:'2026-11-11T04:00:00Z',sourceUrl:'https://zenless.hoyoverse.com/ko-kr/news/166644',sourceTitle:'source',verifiedAt:'2026-10-23T00:00:00Z',pickupMembers:[member('Phoenix','new'),member('Velina'),member('Lower','rerun','rate-up')],image:'/api/media/owner-pool.webp',imageVerified:true,imageLocale:'ko',editor:{revision:3,fields:['image']}};
const context=locale=>({games,byId,t:catalogUi(locale,{}),settings:{},canEdit:false,editMode:false,openEditor(){}});
test('simultaneous character cards show each exact subject in all four locales without duplicating canonical records',()=>{
 const original=JSON.stringify(entry),cards=pickupCards([entry]);assert.equal(cards.length,2);assert.equal(new Set(cards.map(c=>c.key)).size,2);
 assert.deepEqual(cards.map(c=>c.display.title.en),['Phoenix','Velina']);assert.ok(cards.every(c=>c.entry===entry&&c.display.id===entry.id));
 assert.deepEqual(cards.map(c=>c.display.image),['/assets/Phoenix.png','/assets/Velina.png']);assert.equal(JSON.stringify(entry),original);
 for(const locale of ['ko','en','ja','zh']){
  const html=renderToStaticMarkup(React.createElement(CatalogContext.Provider,{value:context(locale)},React.createElement(PickupSection,{group:{id:'group',gameId:'zzz',region:'global',poolType:'character',entries:[entry]},locale,now,saved:[],onSave(){},onOpen(){},weaponEntries:[]})));
  const dom=new JSDOM(html),headings=[...dom.window.document.querySelectorAll('.entry-card h3')].map(e=>e.textContent);
  assert.deepEqual(headings,['Phoenix','Velina']);assert.equal(dom.window.document.querySelectorAll('.entry-card').length,2);assert.ok(!html.includes('owner-pool.webp'));dom.window.close();
 }
});
test('candidates, support choices, weapons and single-member owner originals retain their own model',()=>{
 const choice={...entry,selectionCount:2,pickupMembers:[member('A','rerun','candidate'),member('B','rerun','candidate')]};assert.equal(pickupCards([choice]).length,1);assert.equal(pickupCards([{...entry,kind:'weapon'}]).length,1);
 const single={...entry,pickupMembers:[member('Phoenix')]};assert.equal(pickupCards([single])[0].display,single);
 const missing={...entry,pickupMembers:[member('Phoenix'),{name:loc('No Art'),type:'rerun',role:'featured'}]};assert.equal(pickupCards([missing])[1].display.image,undefined);
});
test('library LIVE requires fresh official live metadata and the selected actual service/language across all games',()=>{
 for(const game of games)for(const region of new Set(game.regions.map(r=>effectiveRegion(game,r))))for(const locale of ['ko','en','ja','zh']){
  const language=contentLanguage(game,region,locale),broadcast={status:'scheduled',official:true,metadataVerified:true,watched:false,locale:language,scheduledAt:'2026-10-23T00:59:00Z',endedAt:null,verifiedAt:new Date(now).toISOString()};
  const e={...entry,gameId:game.id,region,kind:'update',broadcast};
  assert.equal(gameBroadcasts([e],game,region,locale,now)[0]?.broadcast.status,'scheduled','the clock never claims LIVE');
  const live={...e,broadcast:{...broadcast,status:'live',statusCheckedAt:new Date(now).toISOString()}};
  assert.equal(gameBroadcasts([live],game,region,locale,now)[0]?.broadcast.status,'live');
  const html=renderToStaticMarkup(React.createElement(LibraryGameMeta,{count:0,collaborating:false,locale,broadcast:'live'}));assert.match(html,/>LIVE</);assert.match(html,/role="status"/);
  for(const bad of [{...live,broadcast:{...live.broadcast,status:'ended'}},{...live,broadcast:{...live.broadcast,metadataVerified:false}}])assert.equal(gameBroadcasts([bad],game,region,locale,now).length,0);
  assert.equal(gameBroadcasts([live],game,region,locale,now+2*3600000+1).length,0,'stale LIVE expires');
 }
});
test('the audit identifies missing current versions and locale-specific holes without rewriting data',()=>{
 const e={...entry,gameId:'hi3',region:'kr',versionHero:true,kind:'update',pickupMembers:undefined,image:'/ko-banner.png',imageLocale:'ko'};
 const original=JSON.stringify(e),rows=artworkAudit([e],now);assert.equal(new Set(rows.map(r=>r.gameId)).size,18);
 assert.ok(rows.find(r=>r.gameId==='hi3'&&r.region==='kr'&&r.locale==='ja').issues.some(i=>i.code==='missing-locale-artwork'));
 assert.ok(!rows.find(r=>r.gameId==='hi3'&&r.region==='kr'&&r.locale==='ko').issues.length);
 assert.ok(rows.find(r=>r.gameId==='trickcal').issues.some(i=>i.code==='missing-current-version'));assert.equal(JSON.stringify(e),original);
});

test('an empty or wrong-language pickup visual never substitutes the generic game artwork',async()=>{
 const {default:Spotlight}=await import('../components/spotlight.tsx');
 for(const locale of ['ko','en','ja','zh']){
  const game={...byId.hi3,art:byId.hi3.logo},e={...entry,gameId:'hi3',region:'kr',image:'/ko-only.png',imageLocale:'ko',pickupMembers:[]};
  for(const slides of [[],[{id:e.id,entry:e,art:e}]]){
   const html=renderToStaticMarkup(React.createElement(CatalogContext.Provider,{value:{...context(locale),byId:{...byId,hi3:game}}},React.createElement(Spotlight,{slides,index:0,onIndex(){},locale,now,region:'kr',fallbackGame:game,gameView:true,onOpen(){},onGame(){},favorite:false,onFavorite(){}})));
   const dom=new JSDOM(html),visual=dom.window.document.querySelector('.spotlight-visual');
   assert.ok(![...visual.querySelectorAll('img')].some(i=>i.getAttribute('src')===game.logo));
   if(locale!=='ko'||!slides.length){assert.equal(visual.querySelector('img'),null);assert.equal(dom.window.document.querySelector('.spotlight-glow').style.backgroundImage,'');}
   dom.window.close();
  }
 }
});

test('an open library follows saved scheduled/live/ended updates without a reload or a clock-only LIVE transition',async()=>{
 const {act}=await import('react'),{createRoot}=await import('react-dom/client'),{default:Radar}=await import('../components/radar.tsx');
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/',pretendToBeVisual:true}),old=new Map(),originalNow=Date.now;let clock=now,nextData,root;Date.now=()=>clock;
 const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 for(const k of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event','CustomEvent','localStorage','sessionStorage'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);set('ResizeObserver',class{observe(){}disconnect(){}});
 window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};Element.prototype.scrollTo=()=>{};for(const method of ['show','showModal','close'])HTMLDialogElement.prototype[method]=function(){this.open=method!=='close';};
 const timers=new Map();let timerId=0;set('setInterval',(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;});set('clearInterval',id=>timers.delete(id));
 set('fetch',async url=>Response.json(String(url).startsWith('/api/data')?nextData:String(url).startsWith('/api/favorites')?{counts:{},revision:0}:String(url).startsWith('/api/social')?{channels:[]}:{canEdit:false}));
 const poll=async ms=>act(async()=>{for(const t of timers.values())if(t.ms===ms)await t.fn();});
 try{
  for(const locale of ['ko','en','ja','zh']){
   const b={status:'scheduled',official:true,metadataVerified:true,watched:false,locale,scheduledAt:new Date(now-60000).toISOString(),endedAt:null,verifiedAt:new Date(now).toISOString()},e={...entry,pickupMembers:undefined,kind:'update',broadcast:b};
   nextData={entries:[e],sourceChecks:[],settings:{},serverTime:new Date(clock).toISOString()};
   await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(Radar,{initialView:'library',initialLocale:locale,initialLocaleManual:true,initialData:nextData,initialComplete:true}));});
   assert.ok(document.querySelector('.game-grid .library-broadcast.scheduled'));assert.equal(document.querySelector('.game-grid .library-broadcast.live'),null);
   clock+=60000;await poll(1000);assert.equal(document.querySelector('.game-grid .library-broadcast.live'),null);
   nextData={...nextData,entries:[{...e,broadcast:{...b,status:'live',statusCheckedAt:new Date(clock).toISOString()}}]};await poll(60000);assert.match(document.querySelector('.game-grid .library-broadcast.live').textContent,/LIVE/);
   nextData={...nextData,entries:[{...e,broadcast:{...b,status:'ended',endedAt:new Date(clock).toISOString()}}]};await poll(60000);assert.equal(document.querySelector('.game-grid .library-broadcast'),null);
   await act(async()=>root.unmount());root=null;localStorage.clear();
  }
 }finally{await act(async()=>root?.unmount());Date.now=originalNow;dom.window.close();for(const[k,d]of old){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
