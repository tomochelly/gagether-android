import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const {usePublicFavorites}=await import('../components/use-public-favorites.ts');
test('legacy browser stars migrate on return without a click and renew an expired counting session',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki'}),original=new Map();
 const replace=(key,value)=>{original.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});};
 for(const k of ['window','document','localStorage','HTMLElement','Node'])replace(k,dom.window[k]);replace('IS_REACT_ACT_ENVIRONMENT',true);
 localStorage.setItem('patchwork.preferences',JSON.stringify({favorites:['wuwa','zzz','wuwa','obsolete-game']}));
 const posts=[];let sessions=0,expired=false;const nativeTimeout=setTimeout;
 replace('setTimeout',(fn,ms,...args)=>nativeTimeout(fn,ms===30000?10:ms,...args));
 replace('fetch',async(url,opts={})=>{
  if(String(url).includes('session=1')){sessions++;return {ok:true,status:200,json:async()=>({revision:0,counts:{}})};}
  if(opts.method==='POST'){posts.push(JSON.parse(opts.body));if(!expired){expired=true;return {ok:false,status:428,json:async()=>({error:'Expired'})};}return {ok:true,status:200,json:async()=>({revision:1,counts:{wuwa:1,zzz:1}})};}
  return {ok:true,status:200,json:async()=>({counts:{}})};
 });
 function Legacy(){const [favorites,setFavorites]=useState([]),[ready,setReady]=useState(false);useEffect(()=>{setFavorites(JSON.parse(localStorage.getItem('patchwork.preferences')).favorites);setReady(true);},[]);const state=usePublicFavorites(favorites,ready);return React.createElement('span',null,state.counts.wuwa||0);}
 const root=createRoot(document.getElementById('root'));
 try{await act(async()=>root.render(React.createElement(Legacy)));await act(async()=>{await new Promise(r=>nativeTimeout(r,400));});await act(async()=>{await new Promise(r=>nativeTimeout(r,80));});assert.equal(sessions,2);assert.deepEqual(posts.at(-1).favorites,['wuwa','zzz']);assert.equal(document.querySelector('#root span').textContent,'1');}
 finally{await act(async()=>root.unmount());for(const [k,d] of original)d?Object.defineProperty(globalThis,k,d):delete globalThis[k];dom.window.close();}
});
