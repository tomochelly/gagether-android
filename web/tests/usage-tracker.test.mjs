import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
const {default:Tracker}=await import('../components/usage-tracker.tsx');
test('rerenders and scrolling do not add views; heartbeats, navigation and opt-out work',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true});const original=new Map();const set=(k,v)=>{original.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};
 for(const k of ['window','document','navigator','localStorage','location','Event'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);
 const timers=new Map(),calls=[];let seq=0;
 set('setTimeout',(fn,ms)=>{const id=++seq;timers.set(id,{fn,ms,once:true});return id});set('clearTimeout',id=>timers.delete(id));set('setInterval',(fn,ms)=>{const id=++seq;timers.set(id,{fn,ms,once:false});return id});set('clearInterval',id=>timers.delete(id));set('fetch',async(u,o)=>{calls.push(JSON.parse(o.body));return new Response(null,{status:204})});
 const root=createRoot(document.getElementById('root'));const props={enabled:true,view:'game',gameId:'wuwa',locale:'ko',appMode:false};
 const flush=async ms=>act(async()=>{for(const [id,t] of [...timers])if(t.ms===ms){if(t.once)timers.delete(id);await t.fn()}});
 try{
  await act(async()=>root.render(React.createElement(Tracker,props)));await flush(600);assert.equal(calls.length,1);assert.equal(calls[0].type,'view');
  for(let i=0;i<50;i++)await act(async()=>{root.render(React.createElement(Tracker,{...props}));document.dispatchEvent(new Event('scroll'))});await flush(600);assert.equal(calls.length,1);
  await flush(60000);assert.equal(calls[1].type,'heartbeat');assert.equal(calls[1].visitorId,calls[0].visitorId);
  await act(async()=>root.render(React.createElement(Tracker,{...props,view:'detail',pageKey:'chisa'})));await flush(600);assert.equal(calls[2].type,'view');assert.notEqual(calls[2].eventId,calls[0].eventId);
  localStorage.setItem('gagether.usage.optout','1');await flush(60000);assert.equal(calls.length,3);
  localStorage.removeItem('gagether.usage.optout');await act(async()=>root.render(React.createElement(Tracker,{...props,enabled:false})));await flush(60000);assert.equal(calls.length,3);
 }finally{await act(async()=>root.unmount());dom.window.close();for(const [k,v] of original){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
});
