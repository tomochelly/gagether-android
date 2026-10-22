import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const {catalogEntry}=await import('../lib/catalog-index.ts');
const {useEntryDetail}=await import('../components/use-entry-detail.ts');
const entry=id=>({id,gameId:'wuwa',region:'global',verifiedAt:'2026-10-17T00:00:00Z',entityDetails:[{id:id+'-skills'}]});
test('detail cache survives list polling; rapid selection, revision refresh and retry cannot show the wrong kit',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki'}),original=new Map();
 const replace=(k,v)=>{original.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};
 for(const k of ['window','document','Element','HTMLElement','Node'])replace(k,dom.window[k]);replace('IS_REACT_ACT_ENVIRONMENT',true);
 const pending=[],calls=[];replace('fetch',url=>{calls.push(url);return new Promise(resolve=>pending.push(resolve))});
 let state;const Probe=({summary})=>{state=useEntryDetail(summary);return React.createElement('p',null,state.entry?.entityDetails?.[0]?.id||'pending')};
 const root=createRoot(document.getElementById('root'));const a=entry('a'),b=entry('b');
 const render=summary=>act(async()=>root.render(React.createElement(Probe,{summary})));
 const finish=async(full,ok=true)=>act(async()=>pending.shift()({ok,json:async()=>({entry:full})}));
 try{
  await render(catalogEntry(a,'a1'));assert.equal(state.loading,true);assert.equal(calls.length,1);
  await render(catalogEntry(b,'b1'));assert.equal(calls.length,2);
  await finish(a);assert.equal(state.entry.id,'b');assert.equal(state.entry.entityDetails,undefined);
  await finish(b);assert.equal(state.entry.entityDetails[0].id,'b-skills');
  await render(catalogEntry(b,'b1'));assert.equal(calls.length,2);assert.equal(state.entry.entityDetails[0].id,'b-skills');
  await render(null);await render(catalogEntry(a,'a1'));assert.equal(calls.length,2);assert.equal(state.entry.entityDetails[0].id,'a-skills');
  await render(catalogEntry(a,'a2'));assert.equal(calls.length,3);assert.equal(state.loading,true);await finish(a,false);assert.equal(state.error,true);
  await act(async()=>state.retry());assert.equal(calls.length,4);await finish({...a,entityDetails:[{id:'new-skill'}]});assert.equal(state.entry.entityDetails[0].id,'new-skill');
  const owner={...a,entityDetails:[{id:'unsaved-owner-preview'}]};await render(owner);assert.equal(state.entry.entityDetails[0].id,'unsaved-owner-preview');assert.equal(calls.length,4);
 }finally{await act(async()=>root.unmount());dom.window.close();for(const [k,v] of original){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
});
