import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
const {default:Source}=await import('../components/roster-source-link.tsx');
const {default:Rewards}=await import('../components/roster-potential-rewards.tsx');
const {CharacterFacts}=await import('../components/character-roster.tsx');
const c=bootstrap.find(r=>r.gameId==='endfield').characters.find(c=>c.id==='perlica');
const technical='https://github.com/rmxlinux/EndfieldData/blob/a0ed1dac31c502f636c70cee4e3010ca69562a70/TableCfg/PictureTable.json';
test('all four detail locales keep GitHub provenance out of default links while retaining names and small stars',()=>{
 for(const locale of ['ko','en','ja','zh']){
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(CharacterFacts,{character:c,gameId:'endfield',locale,service:'global'}))),d=dom.window.document;
  assert.ok(d.querySelectorAll('details.roster-technical-source').length>0);
  assert.ok([...d.querySelectorAll('.roster-technical-source')].every(e=>!e.open&&!e.querySelector('a')));
  assert.ok(![...d.querySelectorAll('a[href]')].some(a=>new URL(a.href).hostname.includes('github')));
  assert.equal(d.querySelector('h2 .roster-name-text').textContent,c.name[locale]);
  assert.equal(d.querySelector('h2 .roster-name-stars').textContent,'★★★★★');dom.window.close();
 }
});
test('GitHub and raw-data links require disclosure; public publisher links keep their exact destinations',()=>{
 for(const href of [technical,'https://raw.githubusercontent.com/owner/repo/rev/a.json','https://api.github.com/repos/owner/repo']){
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(Source,{href,locale:'ko'},'출처')));
  assert.equal(dom.window.document.querySelector('a'),null);assert.equal(dom.window.document.querySelector('summary').textContent,'데이터 원문');dom.window.close();
 }
 const dom=new JSDOM(renderToStaticMarkup(React.createElement(Source,{href:'https://endfield.gryphline.com/ko-kr',locale:'ko'},'공식 출처')));
 assert.equal(dom.window.document.querySelector('a').getAttribute('href'),'https://endfield.gryphline.com/ko-kr');dom.window.close();
});
test('reward images and source links disclose independently; exact data URLs are reachable only after both source accordions open',async()=>{
 const before=JSON.stringify(c),dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),saved=new Map();
 for(const k of ['window','document','HTMLElement','Element','Node','Event']){saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:dom.window[k],writable:true,configurable:true});}
 saved.set('IS_REACT_ACT_ENVIRONMENT',Object.getOwnPropertyDescriptor(globalThis,'IS_REACT_ACT_ENVIRONMENT'));Object.defineProperty(globalThis,'IS_REACT_ACT_ENVIRONMENT',{value:true,writable:true,configurable:true});
 const {createRoot}=await import('react-dom/client');let root;
 const toggle=async(node,open)=>act(async()=>{node.open=open;node.dispatchEvent(new Event('toggle'));});
 try{
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(Rewards,{character:c,locale:'ko'}));});
  assert.equal(document.querySelectorAll('img,a').length,0);
  const level=document.querySelector('.roster-unlock-level');await toggle(level,true);
  assert.equal(level.querySelectorAll('.roster-unlock-item img').length,2);assert.equal(level.querySelector('a.reference-source-link'),null);
  const sources=level.querySelector('.roster-unlock-sources');await toggle(sources,true);
  assert.equal(sources.querySelector('a').getAttribute('href'),c.potentialRewards[0].image.sourceUrl);
  const data=sources.querySelector('.roster-technical-source');assert.equal(data.querySelector('a'),null);await toggle(data,true);
  assert.equal(data.querySelector('a').getAttribute('href'),technical);
  await toggle(sources,false);assert.equal(level.querySelector('.roster-technical-source'),null);assert.equal(level.querySelectorAll('img').length,2);assert.ok(level.open);
  await toggle(level,false);assert.equal(document.querySelectorAll('img,a').length,0);assert.equal(JSON.stringify(c),before);
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}}
});
