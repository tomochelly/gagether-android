import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import c from '../content/gfl2-combat-catalog.json' with {type:'json'};
const {default:Archive}=await import('../components/gfl2-combat-archive.tsx');
const labels={ko:['세팅 만들기','효과 보기'],en:['Create loadout','View effect'],ja:['設定作成','効果を見る'],zh:['创建配置','查看效果']};
test('every language has readable key effects and attachment descriptions without selecting or moving keys',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/ko/games/gfl2/combat?view=setups',pretendToBeVisual:true}),old=new Map();
 const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 for(const k of ['window','document','HTMLElement','Element','Node','Event','MouseEvent'])set(k,dom.window[k]);
 set('IS_REACT_ACT_ENVIRONMENT',true);
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};
 let writes=0;set('fetch',async(url,init)=>{if(init?.method==='POST')writes++;return{ok:true,json:async()=>url.includes('catalog')?c:{signedIn:false,accountScope:null,setups:[],records:[],canModerate:false}}});
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root'));
 try{
  for(const [locale,[create,summary]]of Object.entries(labels)){
   await act(async()=>root.render(React.createElement(Archive,{key:locale,locale})));
   await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent===create).click());
   const grid=document.querySelector('.gf-key-grid'),cards=[...grid.querySelectorAll('article')],first=cards[0],buttons=[...grid.querySelectorAll('button')],names=buttons.map(b=>b.textContent);
   assert.equal(first.querySelector('strong').textContent,c.characters[0].keys[0].name[locale]);
   assert.equal(first.querySelector('summary').textContent,summary);
   assert.equal(first.querySelector('.gf-key-description p').textContent,c.characters[0].keys[0].description[locale]);
   grid.scrollTop=100;await act(async()=>first.querySelector('summary').click());
   assert.equal(first.querySelector('details').open,true);assert.equal(grid.scrollTop,100);
   assert.deepEqual([...grid.querySelectorAll('button')].map(b=>b.textContent),names);
   assert.equal(grid.querySelectorAll('[aria-pressed="true"]').length,0);
   const select=document.querySelector('.gf-attachments select');assert.equal(select.options[1].textContent,c.sets[0].name[locale]);
   await act(async()=>{select.value=c.sets[0].id;select.dispatchEvent(new Event('change',{bubbles:true}));});
   assert.equal(document.querySelector('.gf-set-description').textContent,c.sets[0].description[locale]);
  }
  assert.equal(writes,0);
 }finally{await act(async()=>root.unmount());dom.window.close();for(const[k,d]of old){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
