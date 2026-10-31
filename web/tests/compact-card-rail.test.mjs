import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';
import React,{act} from 'react';import {JSDOM} from 'jsdom';
const {default:Rail}=await import('../components/compact-card-rail.tsx');
test('overflow controls keep every card reachable, announce their purpose and respect reduced motion',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/',pretendToBeVisual:true}),old=new Map();
 const set=(k,v)=>{old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 for(const k of ['window','document','HTMLElement','Element','Node','Event','MouseEvent'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);
 let width=640,scroll=1600,left=0,moves=[],resize;
 window.matchMedia=()=>({matches:true});
 set('ResizeObserver',class{constructor(cb){resize=cb;}observe(){}disconnect(){}});
 Object.defineProperties(HTMLElement.prototype,{clientWidth:{configurable:true,get:()=>width},scrollWidth:{configurable:true,get:()=>scroll},scrollLeft:{configurable:true,get:()=>left}});
 HTMLElement.prototype.scrollBy=function(options){moves.push(options);left=Math.min(scroll-width,Math.max(0,left+options.left));this.dispatchEvent(new Event('scroll'));};
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root'));
 try{
  await act(async()=>root.render(React.createElement(Rail,{count:8,label:'Upcoming pickups',locale:'en'},Array.from({length:8},(_,i)=>React.createElement('a',{key:i,href:'/item/'+i},'Character '+i)))));
  const track=document.querySelector('[role="region"]'),buttons=[...document.querySelectorAll('button')];
  assert.equal(track.getAttribute('tabindex'),'0');assert.equal(track.querySelectorAll('a').length,8);assert.equal(buttons[0].disabled,true);assert.equal(buttons[1].getAttribute('aria-label'),'Next items');assert.equal(buttons[1].getAttribute('aria-controls'),track.id);
  await act(async()=>buttons[1].click());assert.equal(moves[0].behavior,'auto');assert.ok(left>0);assert.equal(buttons[0].disabled,false);
  await act(async()=>{left=scroll-width;track.dispatchEvent(new Event('scroll'));});assert.equal(buttons[1].disabled,true);
  await act(async()=>{width=1800;scroll=1800;left=0;resize();});
  assert.equal(track.hasAttribute('tabindex'),false);assert.equal(document.querySelector('.compact-rail-navigation').getAttribute('aria-hidden'),'true');assert.equal(track.querySelectorAll('a').length,8);assert.equal(buttons[0].tabIndex,-1);
 }finally{await act(async()=>root.unmount());dom.window.close();for(const[k,d]of old){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
