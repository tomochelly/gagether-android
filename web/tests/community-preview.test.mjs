import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
const {default:Preview}=await import('../components/community-preview.tsx');
const {default:Community}=await import('../components/pickup-community.tsx');
const client=await import('../lib/community-summary-client.ts');
const name=s=>({ko:s,en:s,ja:s,zh:s});
const wait=()=>new Promise(r=>setTimeout(r,100));
test('visible previews batch/deduplicate summaries; isolated members, honest errors and direct detail opening',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki'}),saved=new Map(),observers=[];let calls=[],fail=false,opened='';
 class IO{constructor(cb){this.cb=cb;observers.push(this)}observe(){}disconnect(){}}
 for(const[k,v]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Event:dom.window.Event,HTMLElement:dom.window.HTMLElement,IntersectionObserver:IO,IS_REACT_ACT_ENVIRONMENT:true})){saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});}
 const oldFetch=globalThis.fetch;globalThis.fetch=async(url,options)=>{calls.push({url,options});if(fail)return Response.json({},{status:503});if(!url.includes('/summary?'))return Response.json({average:null,count:0,comments:0,reviews:[],mine:null,signedIn:false,canModerate:false,next:null});const targets=new URL(url,'https://gagether.wiki').searchParams.getAll('target');return Response.json({summaries:Object.fromEntries(targets.map(t=>[t,{average:4.5,count:2,comments:1,excerpt:'<img src=x> A useful opinion'}]))});};
 const root=createRoot(document.getElementById('root')),entry={id:'preview-first',kind:'pickup',gameId:'wuwa',region:'global',pickupMembers:[{name:name('Alice')},{name:name('Beth')}]};
 try{
 await act(async()=>root.render(React.createElement('div',null,...[1,2].map(key=>React.createElement(Preview,{key,entry,locale:'ko',onOpen:m=>{opened=m}})))));assert.equal(calls.length,0);
 await act(async()=>{observers.forEach(o=>o.cb([{isIntersecting:true}]));await wait();});await act(wait);assert.equal(calls.length,1);assert.equal(new URL(calls[0].url,'https://gagether.wiki').searchParams.getAll('target').length,1);assert.equal(calls[0].options.credentials,'omit');assert.match(document.body.textContent,/4.5/);assert.match(document.body.textContent,/<img src=x>/);assert.equal(document.querySelectorAll('img').length,0);
 await act(async()=>{const select=document.querySelector('select');select.value='Beth';select.dispatchEvent(new Event('change',{bubbles:true}));});await act(wait);assert.equal(calls.length,2);assert.notEqual(calls[0].url,calls[1].url);
 await act(async()=>document.querySelector('.card-community-main').click());assert.equal(opened,'Beth');
 fail=true;await act(async()=>{client.invalidateCommunity(entry.id);await wait();});assert.match(document.body.textContent,/4.5/); // failures preserve the last good aggregate
 fail=false;await act(async()=>root.render(React.createElement(Community,{entry,locale:'ko',autoOpenMember:'Beth'})));assert.equal(document.querySelector('details').open,true);assert.equal(document.querySelector('select').value,'Beth');assert.match(calls.at(-1).url,/member=Beth/);
 }finally{await act(async()=>root.unmount());globalThis.fetch=oldFetch;dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}}
});
