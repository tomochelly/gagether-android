import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
const {pickupCards}=await import('../lib/pickup-cards.ts');
const {pickupDetailEntry,samePickupName}=await import('../lib/pickup-detail.ts');
const {default:SecondaryPickups}=await import('../components/secondary-pickups.tsx');
const {default:Radar,EntryArtwork}=await import('../components/radar.tsx');
const {CatalogContext}=await import('../components/catalog-context.tsx');
const {catalogGames,catalogUi}=await import('../lib/editorial.ts');
const {catalogEntry}=await import('../lib/catalog-index.ts');
const icons=JSON.parse(readFileSync(new URL('../content/pickup-member-icons.json',import.meta.url),'utf8'));
const games=catalogGames({}),context=locale=>({games,byId:Object.fromEntries(games.map(g=>[g.id,g])),t:catalogUi(locale,{}),settings:{},canEdit:false,editMode:false,simpleMode:false,openEditor(){}});
const loc=s=>({ko:s,en:s,ja:s,zh:s}),stamp='2026-10-23T10:00:00Z',now=Date.parse(stamp);
const member=(s,role='featured')=>({name:loc(s),role,type:'rerun',rarity:role==='rate-up'?4:5,image:'/assets/'+s+'.png',imageSource:'https://example.com/'+s,imageLocale:'neutral',imageVerified:true,imageKind:'banner'});
const profile=s=>({id:s,name:loc(s),category:loc('Character'),basis:loc('Lv.90'),stats:[{label:loc('ATK'),value:s+' stat'}],groups:[],sources:[],statSourceKind:'community',verifiedAt:stamp});
const base={id:'member-detail',gameId:'bluearchive',region:'kr',kind:'pickup',poolType:'character',title:loc('Combined rotation'),summary:loc('Shared notice'),sourceUrl:'https://bluearchive.nexon.com/',sourceTitle:'Notice',startAt:'2026-10-01T00:00:00Z',endAt:'2026-11-01T00:00:00Z',publishedAt:null,verifiedAt:stamp,pickupMembers:[member('Alpha'),member('Beta'),member('Lower','rate-up')],entityDetails:[profile('Alpha'),profile('Beta'),profile('Lower')]};
test('selected-member projections isolate exact outfit/kit/video across all games and never mutate or narrow canonical editor data',()=>{
 for(const game of games){
  const e={...base,gameId:game.id},before=JSON.stringify(e),cards=pickupCards([e]);assert.equal(cards.length,2);
  assert.equal(cards[1].display.pickupMembers.some(m=>m.role==='rate-up'),true);
  for(const chosen of e.pickupMembers.slice(0,2)){
   const p=pickupDetailEntry(e,chosen.name);assert.equal(p.id,e.id);assert.deepEqual(p.pickupMembers.map(m=>m.name.en),[chosen.name.en]);assert.deepEqual(p.entityDetails.map(p=>p.name.en),[chosen.name.en]);assert.equal(p.image,chosen.image);assert.equal(cards[1].entry,e);
  }
  assert.equal(JSON.stringify(e),before);
 }
 const own={...base,pickupMembers:[member('Alpha'),member('Lower','rate-up')],image:'/api/media/owner.png',imageVerified:true,imageLocale:'neutral',editor:{revision:2,fields:['image']}};
 assert.equal(pickupDetailEntry(own).image,own.image);assert.deepEqual(pickupDetailEntry(own).entityDetails.map(p=>p.name.en),['Alpha']);
});
test('support choices remain one selection pool; exact name matching never merges another outfit and unknown member falls back safely',()=>{
 const choice={...base,selectionCount:1,poolType:'support'};assert.equal(pickupDetailEntry(choice),choice);
 assert.equal(samePickupName(loc('Beta'),loc('Beta (Swimsuit)')),false);assert.equal(samePickupName(loc('Beta (Swimsuit)'),loc('Beta（Swimsuit）')),true);
 assert.equal(pickupDetailEntry(base,loc('Missing')).title.en,'Alpha');
 const videos=[{kind:'character',entityNames:[loc('Alpha')],youtubeId:'a'},{kind:'character',entityNames:[loc('Beta')],youtubeId:'b'},{kind:'version',youtubeId:'v'},{kind:'character',youtubeId:'unknown'}];
 assert.deepEqual(pickupDetailEntry({...base,videos},loc('Beta')).videos.map(v=>v.youtubeId),['b']);
});
test('Wuwa rate-ups have exact immutable small portraits and never create full detail artwork or empty lower-rarity slots',()=>{
 const rateups=icons.map(r=>({name:r.names[0],role:'rate-up',type:'unknown',rarity:4}));const e={...base,gameId:'wuwa',region:'global',pickupMembers:[member('Alpha'),...rateups]};
 for(const row of icons){const bytes=readFileSync(new URL('../public'+row.icon.image,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);assert.equal(bytes.readUInt32BE(16),256);assert.equal(bytes.readUInt32BE(20),256);}
 for(const locale of ['ko','en','ja','zh']){
  const html=renderToStaticMarkup(React.createElement(SecondaryPickups,{entry:e,locale})),dom=new JSDOM(html);assert.equal(dom.window.document.querySelectorAll('.secondary-pickup').length,3);assert.equal(dom.window.document.querySelectorAll('.secondary-pickup img').length,3);for(const m of rateups)assert.ok(dom.window.document.body.textContent.includes(m.name[locale]));dom.window.close();
  const art=renderToStaticMarkup(React.createElement(CatalogContext.Provider,{value:context(locale)},React.createElement(EntryArtwork,{entry:e,locale,variant:'detail'})));assert.ok(!art.includes('member-art-panel'));assert.ok(!art.includes('art-pending'));assert.ok(!art.includes('wuwa-lumi.png'));
 }
});
test('mounted detail opens the clicked Blue Archive character, survives full-detail fetching/polling and switches only its own kit in all locales',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/ko',pretendToBeVisual:true}),old=new Map(),originalNow=Date.now;Date.now=()=>now;
 const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 for(const k of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event','CustomEvent','MouseEvent','localStorage','sessionStorage'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);set('ResizeObserver',class{observe(){}disconnect(){}});
 window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};Element.prototype.scrollTo=()=>{};Element.prototype.scrollIntoView=()=>{};for(const method of ['show','showModal','close'])HTMLDialogElement.prototype[method]=function(){this.open=method!=='close';};set('setInterval',()=>0);set('clearInterval',()=>{});
 let full,data,loads=0;set('fetch',async url=>{const path=String(url);if(path.startsWith('/api/entry?id=')){loads++;return Response.json({entry:full});}return Response.json(path.startsWith('/api/data')?data:path.startsWith('/api/favorites')?{counts:{},revision:0}:path.startsWith('/api/community')?{average:null,count:0,comments:0,reviews:[],mine:null,signedIn:false,canModerate:false,next:null}:path.startsWith('/api/social')?{channels:[]}:{canEdit:false});});
 const {createRoot}=await import('react-dom/client');let root;
 try{
  for(const locale of ['ko','en','ja','zh']){
   full={...base,id:'detail-'+locale,pickupMembers:base.pickupMembers.map((m,i)=>({...m,name:{ko:'캐릭터'+i,en:'Character'+i,ja:'キャラクター'+i,zh:'角色'+i}}))};full.entityDetails=full.pickupMembers.map((m,i)=>({...profile('profile-'+i),name:m.name}));
   data={entries:[catalogEntry(full,'v1')],settings:{},sourceChecks:[],serverTime:stamp};
   await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(Radar,{initialLocale:locale,initialLocaleManual:true,initialView:'game',initialGameId:'bluearchive',initialRegion:'kr',initialData:data,initialComplete:true,initialDeferred:true}));});
   await act(async()=>document.querySelectorAll('.pickup-card .entry-body')[1].click());assert.equal(document.querySelector('.detail-dialog h2').textContent,full.pickupMembers[1].name[locale]);assert.deepEqual([...document.querySelectorAll('.detail-dialog .entity-profile h4')].map(n=>n.textContent),[full.pickupMembers[1].name[locale]]);assert.equal(document.querySelector('.detail-dialog .secondary-pickups'),null);
   full={...full,entityDetails:full.entityDetails.map(p=>({...p,stats:[{label:loc('ATK'),value:'Refreshed'}]}))};data={...data,entries:[catalogEntry(full,'v2')]};await act(async()=>window.dispatchEvent(new Event('gagether:data-changed')));
   assert.equal(document.querySelector('.detail-dialog h2').textContent,full.pickupMembers[1].name[locale]);assert.equal(document.querySelectorAll('.detail-dialog .entity-profile').length,1);assert.match(document.querySelector('.detail-dialog .entity-profile').textContent,/Refreshed/);
   await act(async()=>document.querySelector('.detail-dialog .pickup-detail-tabs button').click());assert.equal(document.querySelector('.detail-dialog h2').textContent,full.pickupMembers[0].name[locale]);assert.deepEqual([...document.querySelectorAll('.detail-dialog .entity-profile h4')].map(n=>n.textContent),[full.pickupMembers[0].name[locale]]);
   await act(async()=>document.querySelector('.detail-dialog .dialog-close').click());full={...full,id:'future-'+locale,startAt:'2026-10-25T00:00:00Z'};data={...data,entries:[catalogEntry(full,'future-v1')]};await act(async()=>window.dispatchEvent(new Event('gagether:data-changed')));
   await act(async()=>document.querySelectorAll('.upcoming-card .upcoming-info')[1].click());assert.equal(document.querySelector('.detail-dialog h2').textContent,full.pickupMembers[1].name[locale]);assert.deepEqual([...document.querySelectorAll('.detail-dialog .entity-profile h4')].map(n=>n.textContent),[full.pickupMembers[1].name[locale]]);
   await act(async()=>root.unmount());root=null;localStorage.clear();sessionStorage.clear();
  }
  assert.ok(loads>=8);
 }finally{await act(async()=>root?.unmount());Date.now=originalNow;dom.window.close();for(const[k,d]of old){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
