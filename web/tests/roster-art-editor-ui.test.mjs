import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';
import React,{act} from 'react';import {JSDOM} from 'jsdom';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
const {default:Editor}=await import('../components/roster-artwork-editor.tsx');
test('mounted artwork editor previews cached image placement and preserves failed saves and independent detail drafts',async()=>{
 const c=bootstrap.find(d=>d.gameId==='nikke').characters.find(c=>c.id==='1'),dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/owner/characters?game=nikke',pretendToBeVisual:true}),saved=new Map();
 const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};
 for(const k of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event','MouseEvent','KeyboardEvent','sessionStorage'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);set('getComputedStyle',window.getComputedStyle.bind(window));set('ResizeObserver',class{observe(){}disconnect(){}});set('confirm',()=>true);
 HTMLElement.prototype.getBoundingClientRect=function(){return {x:0,y:0,left:0,top:0,right:240,bottom:400,width:240,height:400,toJSON(){}}};
 Object.defineProperties(dom.window.HTMLImageElement.prototype,{complete:{get:()=>true},naturalWidth:{get:()=>2048},naturalHeight:{get:()=>2048}});
 let fail=true,posts=0,wire,frames={images:[]},revision=0;
 set('fetch',async(path,options)=>{const u=new URL(path,'https://gagether.wiki');if(options?.method==='POST'){posts++;wire=JSON.parse(options.body);if(fail)return Response.json({error:'Unconfirmed save. Input retained.'},{status:503});frames=wire.changes;revision++;return Response.json({frames,revision,history:[]})}return Response.json(u.searchParams.has('id')?{kind:'roster',character:c,frames,revision,history:[]}:{characters:[{id:c.id,name:c.name}]})});
 const {createRoot}=await import('react-dom/client');let root;const button=name=>[...document.querySelectorAll('button')].find(b=>b.textContent===name);
 try{
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(Editor,{locale:'ko',initialGame:'nikke',initialId:c.id}));await new Promise(setImmediate)});
  assert.ok(document.querySelector('.roster-framing-canvas img'));
  await act(async()=>document.querySelector('.roster-framing-canvas').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true})));
  const img=document.querySelector('.roster-framing-canvas img');assert.equal(img.style.position,'absolute');assert.equal(img.style.maxWidth,'none');assert.equal(img.style.transform,'none');const galleryUrl=img.getAttribute('src');
  await act(async()=>{button('저장').click();button('저장').click()});assert.equal(posts,1);assert.match(document.querySelector('[role=alert]').textContent,/Unconfirmed/);assert.ok(sessionStorage.getItem('gagether.owner.roster-art.nikke.1'));assert.equal(button('저장').disabled,false);
  await act(async()=>button('상세 일러스트').click());await act(async()=>button('전체 맞춤').click());fail=false;await act(async()=>button('저장').click());assert.equal(posts,2);assert.equal(wire.changes.images.length,1);assert.ok(wire.changes.images[0].gallery);assert.deepEqual(wire.changes.images[0].detail,{x:50,y:50,zoom:1,fit:'contain'});assert.equal(wire.characterId,'1');assert.equal(wire.gameId,'nikke');assert.equal(button('저장').disabled,true);assert.equal(sessionStorage.getItem('gagether.owner.roster-art.nikke.1'),null);assert.equal(document.querySelector('.roster-framing-canvas img').getAttribute('src'),galleryUrl);
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
});
