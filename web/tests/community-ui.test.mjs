import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
const {default:Community}=await import('../components/pickup-community.tsx');
const name=s=>({ko:s,en:s,ja:s,zh:s});
test('community is opt-in loaded, member-isolated, accessible, and plain-text only',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki'});const saved=new Map();
 for(const [k,v] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Event:dom.window.Event,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true})){saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});}
 const oldFetch=globalThis.fetch;let calls=[],fail=false;
 globalThis.fetch=async(url,options={})=>{calls.push({url,options});if(options.method==='POST')return Response.json({ok:true});if(fail)return Response.json({error:'fail'},{status:503});return Response.json({average:4,count:1,comments:1,reviews:[{id:'other',author:'1234abcd',stars:4,body:'<img src=x onerror=alert(1)>',updatedAt:1,likes:0,liked:false,mine:false,reported:false,revision:1}],mine:null,signedIn:true,canModerate:false,next:null});};
 const root=createRoot(document.getElementById('root'));const entry={id:'first',kind:'pickup',gameId:'wuwa',region:'global',pickupMembers:[{name:name('Alice')},{name:name('Beth')}]};
 try{
 await act(async()=>root.render(React.createElement(Community,{entry,locale:'ko'})));assert.equal(calls.length,0);assert.equal(document.querySelector('textarea'),null);
 await act(async()=>{const d=document.querySelector('details');d.open=true;d.dispatchEvent(new Event('toggle'));});
 assert.equal(calls.length,1);assert.match(calls[0].url,/member=Alice/);assert.equal(document.querySelectorAll('input[type=radio]').length,5);assert.equal(document.querySelectorAll('img').length,0);assert.match(document.body.textContent,/<img src=x/);
 await act(async()=>document.querySelector('input[value="5"]').click());assert.equal(document.querySelector('input[value="5"]').checked,true);
 await act(async()=>document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 const sent=JSON.parse(calls.find(c=>c.options.method==='POST').options.body);assert.equal(sent.stars,5);assert.equal(sent.member,'Alice');assert.equal(sent.revision,0);
 await act(async()=>{const select=document.querySelector('select');select.value='Beth';select.dispatchEvent(new Event('change',{bubbles:true}));});assert.match(calls.at(-1).url,/member=Beth/);assert.equal(document.querySelectorAll('input:checked').length,0);
 for(const locale of ['en','ja','zh']){await act(async()=>root.render(React.createElement(Community,{entry,locale})));assert.equal(document.querySelector('textarea').maxLength,400);assert.ok(!document.querySelector('summary').textContent.includes('한줄'));}
 await act(async()=>{window.dispatchEvent(new Event('gagether:account-changed'));});assert.match(calls.at(-1).url,/member=Beth/);
 fail=true;await act(async()=>{window.dispatchEvent(new Event('gagether:account-changed'));});assert.ok(document.querySelector('[role=alert]'));assert.equal(document.querySelector('form'),null);
 }finally{await act(async()=>root.unmount());globalThis.fetch=oldFetch;dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}}
});
