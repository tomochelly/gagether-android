import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
const {gameBroadcasts,gameBroadcastArchive}=await import('../lib/broadcast-visibility.ts');
const {favoriteBroadcastArchive}=await import('../lib/favorite-updates.ts');
const {changeBroadcastStatus}=await import('../lib/broadcast-archive.ts');
const {catalogGames,catalogUi}=await import('../lib/editorial.ts');
const {CatalogContext}=await import('../components/catalog-context.tsx');
const {OwnerInlineProvider}=await import('../components/owner-inline.tsx');
const {BroadcastRoom}=await import('../components/favorite-updates.tsx');
const now=Date.now(),stamp=new Date(now).toISOString(),loc=s=>({ko:s,en:s,ja:s,zh:s}),games=catalogGames({}),ba=games.find(g=>g.id==='bluearchive');
const record=(id='live',status='live',region='jp',locale='ja')=>({id,gameId:'bluearchive',kind:'update',region,title:loc(id+' official stream'),summary:loc(''),server:region,sourceUrl:'https://bluearchive.jp/',sourceTitle:'Official',startAt:null,endAt:null,publishedAt:stamp,verifiedAt:stamp,broadcast:{status,youtubeId:id==='live'?'abcdefghijk':'lmnopqrstuv',channel:'Official',locale,sourceUrl:'https://www.youtube.com/watch?v='+(id==='live'?'abcdefghijk':'lmnopqrstuv'),announcementUrl:'https://bluearchive.jp/',originalTitle:id,announcedAt:null,scheduledAt:new Date(now-3600000).toISOString(),endedAt:null,official:true,metadataVerified:true,watched:false,verifiedAt:stamp,statusCheckedAt:stamp}});
test('archive isolates actual service and source language, excludes cancelled/elapsed reservations and deduplicates against ended records',()=>{
 const live=record(),ended={...live,id:'ended',broadcast:changeBroadcastStatus(live.broadcast,'ended',new Date(now+1000).toISOString())};
 const rows=[live,ended,record('cancelled','cancelled'),record('kr','ended','kr','ko'),record('wrong-language','ended','jp','en')];
 assert.deepEqual(gameBroadcastArchive(rows,ba,'jp','ko').map(e=>e.id),['ended']);assert.equal(gameBroadcasts(rows,ba,'jp','ko',now).length,0);
 assert.deepEqual(favoriteBroadcastArchive(rows,games,['bluearchive'],'kr',{bluearchive:'jp'},'ko').map(e=>e.id),['ended']);assert.equal(favoriteBroadcastArchive(rows,games,[],'jp',{},'ja').length,0);
 assert.equal(gameBroadcastArchive([{...live,broadcast:{...live.broadcast,status:'scheduled',scheduledAt:'2020-01-01T00:00:00Z'}}],ba,'jp','ja').length,0);
 assert.equal(ended.broadcast.endedAt,null);assert.equal(ended.broadcast.verifiedAt,stamp);assert.equal(changeBroadcastStatus({...ended.broadcast,endedAt:stamp},'scheduled',stamp).endedAt,null);
 const owner={...live,id:'owner',editor:{revision:1,updatedAt:stamp,fields:['broadcast']},broadcast:changeBroadcastStatus(live.broadcast,'ended',stamp)};
 assert.deepEqual(gameBroadcastArchive([owner,{...live,broadcast:{...live.broadcast,statusCheckedAt:new Date(now+3000).toISOString()}}],ba,'jp','ja').map(e=>e.id),['owner']);
});
test('archive tabs, replay and owner end-save work on the mounted room; failures retain inputs and public viewers have no controls',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),old=new Map();const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 for(const k of ['window','document','HTMLElement','Element','Node','Event','MouseEvent','sessionStorage'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);set('ResizeObserver',class{observe(){}disconnect(){}});
 const {createRoot}=await import('react-dom/client');const root=createRoot(document.getElementById('root'));let stored=record(),fail=true,posts=0;
 set('fetch',async(_url,init)=>{if(init?.method==='POST'){posts++;if(fail)return {ok:false,status:503,json:async()=>({error:'Save unavailable'})};stored={...stored,...JSON.parse(init.body).changes,editor:{revision:1,updatedAt:stamp,fields:['broadcast']}};}return {ok:true,json:async()=>({entry:stored})};});
 const context={games,byId:Object.fromEntries(games.map(g=>[g.id,g])),t:catalogUi('ko',{}),settings:{},canEdit:true,editMode:true,simpleMode:false,openEditor(){}};
 const no=()=>{};
 function Harness(){const [items,setItems]=React.useState([stored]);return React.createElement(CatalogContext.Provider,{value:context},React.createElement(OwnerInlineProvider,{enabled:true,onSaved:e=>setItems([e]),onPreview:no,onActive:no},React.createElement(BroadcastRoom,{entries:gameBroadcasts(items,ba,'jp','ko',now),archive:gameBroadcastArchive(items,ba,'jp','ko'),locale:'ko',now,onOpen:no})));}
 try{
  await act(async()=>root.render(React.createElement(Harness)));await act(async()=>{document.querySelector('.broadcast-copy .owner-edit-small').click();await import('../components/owner-inline-form.tsx');});
  await act(async()=>[...document.querySelectorAll('.owner-inline-form button')].find(b=>b.textContent==='방송 종료로 변경').click());
  await act(async()=>document.querySelector('.owner-inline-form .editor-primary').click());assert.equal(posts,1);assert.match(document.querySelector('[role=alert]').textContent,/Save unavailable/);assert.equal(document.querySelector('.owner-inline-form select').value,'ended');assert.equal(document.querySelector('.broadcast-state').textContent,'방송 중');
  fail=false;await act(async()=>document.querySelector('.owner-inline-form .editor-primary').click());assert.equal(stored.broadcast.status,'ended');assert.equal(stored.broadcast.endedAt,null);assert.equal(document.querySelector('.broadcast-feature'),null);
  await act(async()=>document.querySelector('.broadcast-view-tabs button:nth-child(2)').click());assert.equal(document.querySelector('.broadcast-state').textContent,'방송 종료');assert.match(document.querySelector('.broadcast-screen button').textContent,/다시 보기/);
  await act(async()=>document.querySelector('.broadcast-screen button').click());assert.match(document.querySelector('iframe').getAttribute('src'),/abcdefghijk/);
  const replay=record('past','ended');const html=renderToStaticMarkup(React.createElement(CatalogContext.Provider,{value:{...context,canEdit:false,editMode:false}},React.createElement(OwnerInlineProvider,{enabled:false,onSaved:no,onPreview:no,onActive:no},React.createElement(BroadcastRoom,{entries:[],archive:[replay],locale:'ko',now,onOpen:no}))));assert.equal(html.includes('owner-edit-small'),false);assert.match(html,/방송 종료/);
 }finally{await act(async()=>root.unmount());dom.window.close();for(const[k,d]of old){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
