import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';
import React,{act} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {JSDOM} from 'jsdom';
import roster from '../content/character-rosters/bootstrap.json' with {type:'json'};
import guides from '../content/wuwa-build-guides.json' with {type:'json'};
import wuwa from '../content/wuwa-reference.json' with {type:'json'};
const {cachedMobileFeed}=await import('../lib/mobile-feed-cache.ts');
const {exactMontageCharacter,montageMembers}=await import('../lib/pickup-montage.ts');
const {gameCombatModes,combatSamples}=await import('../lib/game-combat.ts');
const {default:Combat}=await import('../components/game-combat.tsx');
const {WuwaBuildGuideContent:Guide}=await import('../components/wuwa-build-guide.tsx');
const {characterBuildGuide}=await import('../lib/wuwa-build-data.ts');
const {GET:buildApi}=await import('../app/api/wuwa/builds/route.ts');
const {default:SectionNav}=await import('../components/character-section-nav.tsx');
const {default:PickupMontage}=await import('../components/pickup-montage.tsx');
const {loadMontageDirectory}=await import('../lib/pickup-montage-directory.ts');
test('mobile projection avoids repeated heavy reads and unchanged semantic content keeps its revision across freshness buckets',async()=>{
 let version='one',reads=0,body={schemaVersion:1,webRevision:'test',entries:[{id:'preserved',startAt:null,endAt:'2026-11-03T10:59:00+09:00'}]};
 const options={build:'maintenance-test',locale:'ko',expanded:true,revision:async()=>version,read:async()=>{reads++;return body;}};
 let r=await cachedMobileFeed(new Request('https://gagether.wiki/api/mobile/data?locale=ko'),options),first=await r.json();assert.equal(first.entries[0].startAt,null);assert.equal(reads,1);
 const request=()=>new Request('https://gagether.wiki/api/mobile/data?locale=ko&since='+first.revision);
 r=await cachedMobileFeed(request(),options);assert.equal((await r.json()).unchanged,true);assert.equal(reads,1);
 version='next-minute';r=await cachedMobileFeed(request(),options);assert.equal((await r.json()).unchanged,true);assert.equal(reads,2);
 version='actual-data-change';body={...body,entries:[...body.entries,{id:'new',startAt:null,endAt:null}]};r=await cachedMobileFeed(request(),options);const changed=await r.json();assert.notEqual(changed.revision,first.revision);assert.equal(changed.entries.length,2);assert.ok(!changed.unchanged);
 r=await cachedMobileFeed(new Request('https://gagether.wiki/api/mobile/data'),{...options,revision:async()=>{throw Error('DB unavailable');}});assert.equal(r.status,503);
});
test('multi-character banner lookup keeps exact outfits and actual services, rejects ambiguous names, and preserves root owner artwork',()=>{
 const ba=roster.find(r=>r.gameId==='bluearchive'),names=['Wakamo','Hoshino (Swimsuit)','Mika','Hanako (Swimsuit)','Hina (Dress)'];
 for(const en of names){const row=exactMontageCharacter({ko:'',en,ja:'',zh:''},ba.characters,'kr');assert.ok(row,en);assert.ok(row.regions.includes('kr'));}
 const dress=ba.characters.find(c=>c.name.en==='Hina (Dress)');assert.equal(exactMontageCharacter({en:'Hina (another outfit)'},ba.characters,'kr'),undefined);
 assert.equal(exactMontageCharacter(dress.name,[dress,{...dress,id:'ambiguous'}],'kr'),undefined);
 assert.equal(exactMontageCharacter(dress.name,[{...dress,regions:['jp']}],'kr'),undefined);
 const entry={kind:'pickup',poolType:'character',selectionCount:1,pickupMembers:[{name:dress.name,role:'candidate'}]};assert.equal(montageMembers(entry).length,1);
 assert.equal(montageMembers({...entry,image:'https://example.com/owner.png',imageVerified:true,imageLocale:'neutral',editor:{fields:['image']}}).length,0);
 assert.equal(montageMembers({...entry,editor:{fields:['pickupMembers']}}).length,0);
});
test('selection montage retains a visible prefetch after carousel unmount, deduplicates the read and replaces promotional posters with exact roster illustrations',async()=>{
 const ba=roster.find(r=>r.gameId==='bluearchive'),names=['Wakamo','Hoshino (Swimsuit)','Mika','Hanako (Swimsuit)','Hina (Dress)'],characters=names.map(en=>ba.characters.find(c=>c.name.en===en));
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),saved=new Map();const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};for(const k of ['window','document','HTMLElement','HTMLImageElement','Element','Node','Event'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);set('IntersectionObserver',undefined);set('ResizeObserver',class{observe(){}disconnect(){}});let reads=0,release;set('fetch',async url=>{reads++;assert.equal(String(url),'/api/characters?game=bluearchive');return new Promise(resolve=>{release=resolve;});});const{createRoot}=await import('react-dom/client');let root;
 const reading=loadMontageDirectory('bluearchive'),render=()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(PickupMontage,{entry:{kind:'pickup',gameId:'bluearchive',region:'kr',selectionCount:1,title:characters[0].name,pickupMembers:characters.map(c=>({name:c.name,image:'https://example.com/recruitment-poster.png',imageVerified:true,imageLocale:'neutral',imageKind:'banner'}))},locale:'ko'}));};
 try{await act(async()=>render());assert.equal(reads,1);await act(async()=>root.unmount());root=undefined;release(Response.json({data:{gameId:'bluearchive',characters}}));await reading;await act(async()=>render());assert.equal(reads,1);const images=[...document.querySelectorAll('.pickup-montage-panel img')];assert.equal(images.length,5);for(let i=0;i<5;i++){assert.ok(images[i].src.includes('/student/portrait/'+characters[i].id+'.webp'));assert.equal(images[i].alt,characters[i].name.ko);}}
 finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,d]of saved)d?Object.defineProperty(globalThis,k,d):delete globalThis[k];}
});
test('sixty build guides bind current form IDs, preserve source calculation versions and complete five-piece combinations without inventing usage rates',()=>{
 assert.equal(guides.builds.length,60);assert.equal(new Set(guides.builds.map(b=>b.characterId)).size,60);
 for(const b of guides.builds){assert.ok(wuwa.characters.some(c=>c.id===b.characterId&&c.name.en===b.name.en));assert.ok(b.sourceUrl.startsWith('https://www.prydwen.gg/wuthering-waves/characters/'));assert.ok(b.sourceReviewPatch&&b.sourceBuildPatch);for(const v of b.variants)assert.equal(v.set.pieces+v.complementarySets.reduce((n,s)=>n+s.pieces,0),5);for(const team of b.teams){assert.equal(team.slots.length,3);for(const ids of team.slots){assert.equal(ids.length,1);assert.ok(wuwa.characters.some(c=>c.id===ids[0]));}}assert.ok(!('usageRate'in b));}
 for(const locale of ['ko','en','ja','zh']){const dom=new JSDOM(renderToStaticMarkup(React.createElement(Guide,{characterId:'1508',locale,data:characterBuildGuide('1508')})));assert.ok(dom.window.document.querySelector('.build-main-stats'));assert.ok(dom.window.document.querySelectorAll('.build-team-slot').length>=3);assert.ok(dom.window.document.querySelector('.wuwa-build-guide footer').textContent.includes('Prydwen'));dom.window.close();}
});
test('seventeen additional games have native mode pages and source-backed samples retain null dates, unpublished rates and exact character identities',()=>{
 assert.equal(new Set(gameCombatModes.map(m=>m.gameId)).size,17);assert.equal(gameCombatModes.length,43);assert.equal(combatSamples.length,8);assert.equal(combatSamples.reduce((n,s)=>n+s.teams.length,0),57);
 for(const s of combatSamples){assert.ok(s.denominator.notPopulationRate&&s.denominator.notOwnershipRate);assert.ok(gameCombatModes.some(m=>m.gameId===s.gameId&&m.id===s.modeId));for(const team of s.teams){if(team.usageRate!==null)assert.ok(Number.isFinite(team.usageRate));for(const member of team.members)if(member.rosterMatched)assert.ok(roster.find(r=>r.gameId===s.gameId).characters.some(c=>c.id===member.id));}}
 assert.equal(combatSamples.find(s=>s.gameId==='genshin').asOf,null);assert.equal(combatSamples.find(s=>s.gameId==='nikke').teams[0].usageRate,null);
 for(const gameId of new Set(gameCombatModes.map(m=>m.gameId)))for(const locale of ['ko','en','ja','zh']){const dom=new JSDOM(renderToStaticMarkup(React.createElement(Combat,{gameId,locale,region:'kr'})));if(['gfl2','zzz'].includes(gameId)){assert.ok(dom.window.document.querySelector('[role=status]'));}else{assert.ok(dom.window.document.querySelector('.combat-heading h1').textContent);assert.ok(dom.window.document.querySelectorAll('.combat-mode-nav button').length);}dom.window.close();}
});
test('section navigation opens folded content and moves focus within its own character, respecting reduced motion',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),saved=new Map();const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};for(const k of ['window','document','HTMLElement','HTMLDetailsElement','Element','Node','Event','MouseEvent'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);window.matchMedia=()=>({matches:true});let scrolled;Element.prototype.scrollIntoView=function(options){scrolled={target:this,options};};const{createRoot}=await import('react-dom/client');let root;
 try{await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement('article',{'data-character-content':true},React.createElement(SectionNav,{locale:'ko',items:[{key:'stats',label:'스테이터스'},{key:'build',label:'추천 세팅'}]}),React.createElement('details',{'data-character-section':'build'},React.createElement('summary',null,'접힌 추천'),React.createElement('p',null,'본문'))));});await act(async()=>[...document.querySelectorAll('nav button')].find(b=>b.textContent==='추천 세팅').click());assert.equal(document.querySelector('details').open,true);assert.equal([...document.querySelectorAll('nav button')].find(b=>b.textContent==='추천 세팅').getAttribute('aria-current'),'location');assert.equal(document.activeElement.tagName,'SUMMARY');assert.equal(scrolled.options.behavior,'auto');assert.equal(scrolled.target,document.querySelector('details'));}
 finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,d]of saved)d?Object.defineProperty(globalThis,k,d):delete globalThis[k];}
});

test('build API delivers only one exact character and its team identities, with immutable source facts and conditional caching',async()=>{const url='https://gagether.wiki/api/wuwa/builds?id=1508';const r=await buildApi(new Request(url)),data=await r.json();assert.equal(r.status,200);assert.equal(data.builds.length,1);assert.equal(data.builds[0].characterId,'1508');assert.ok(data.characters.length<guides.characters.length);assert.deepEqual(data.builds[0],guides.builds.find(b=>b.characterId==='1508'));assert.equal((await buildApi(new Request(url,{headers:{'If-None-Match':r.headers.get('ETag')}}))).status,304);assert.equal((await buildApi(new Request('https://gagether.wiki/api/wuwa/builds?id=unknown'))).status,404);});

test('native read projection keeps active and near-future exact clocks without shipping expired archive rows or manufacturing dates',async()=>{const {mobileReminderWindow}=await import('../lib/mobile.ts');const now=Date.parse('2026-10-27T00:00:00Z'),at=d=>new Date(now+d).toISOString();assert.ok(mobileReminderWindow({startAt:null,endAt:at(3600000)},now));assert.ok(mobileReminderWindow({startAt:at(86400000),endAt:null},now));assert.ok(mobileReminderWindow({startAt:null,endAt:at(-60000)},now));assert.ok(!mobileReminderWindow({startAt:null,endAt:at(-7*3600000)},now));assert.ok(!mobileReminderWindow({startAt:null,endAt:null},now));assert.ok(!mobileReminderWindow({startAt:at(120*86400000),endAt:at(121*86400000)},now));assert.ok(mobileReminderWindow({startAt:at(-86400000),endAt:at(120*86400000)},now));});
