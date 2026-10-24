import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import React,{act} from 'react';import {JSDOM} from 'jsdom';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
const {CharacterFacts}=await import('../components/character-roster.tsx'),model=await import('../lib/character-roster.ts'),{enrichCharacterRoster}=await import('../lib/character-roster-enrichment.ts');
const nte=bootstrap.find(r=>r.gameId==='nte');
test('NTE full originals and detail-only progression survive sparse existing snapshots without adding heavy initial-list fields',()=>{
 assert.equal(nte.characters.length,24);for(const c of nte.characters){assert.ok(c.image.url.includes('/roster-bootstrap/'));assert.ok(c.image.width>=2000);assert.notEqual(c.image.kind,'portrait');assert.equal(c.statProgression.rows.length,80);assert.ok(c.skillTables.length>=4);const summary=model.rosterSummary(c);for(const key of ['statProgression','skillTables','variantDetails','stats','sections'])assert.ok(!(key in summary));}
 const old=structuredClone(nte);for(const c of old.characters){c.image={url:'https://cdn.prydwen.gg/portrait.webp',kind:'portrait',sourceUrl:c.sourceUrl};c.stats=c.stats.slice(0,3);delete c.statProgression;delete c.skillTables;delete c.variantDetails;}
 const enriched=enrichCharacterRoster(old);assert.ok(enriched.characters.every(c=>c.stats.some(s=>s.id==='crit_rate')&&c.statProgression.rows.length===80&&c.image.url.includes('/roster-bootstrap/')));
});
test('mounted NTE levels and skill ranks use actual rows; Zero gender changes its own coefficients and original artwork',async()=>{
 const zero=nte.characters.find(c=>c.id==='1'),dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/ko/games/nte/characters/1',pretendToBeVisual:true}),saved=new Map();
 const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};for(const k of ['window','document','HTMLElement','HTMLSelectElement','Element','Node','Event','MouseEvent'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);const {createRoot}=await import('react-dom/client');let root;
 const change=async(selector,value)=>act(async()=>{const element=document.querySelector(selector);Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(element,String(value));element.dispatchEvent(new Event('change',{bubbles:true}));});
 try{
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(CharacterFacts,{character:zero,locale:'ko',service:'global'}));});
  assert.equal(document.querySelector('[aria-label="캐릭터 레벨"]').value,'80');assert.equal(document.querySelector('.roster-skill-table dd').textContent,'19.2%');
  await change('[aria-label="캐릭터 레벨"]',1);assert.equal(document.querySelector('.roster-stats dd').textContent,zero.statProgression.rows[0].values.hp);
  await change('[aria-label="스킬 레벨"]',13);assert.equal(document.querySelector('.roster-skill-table dd').textContent,zero.variantDetails.female.skillTables[0].values[0].levels[12]);
  const femaleArt=document.querySelector('.roster-detail-art img').getAttribute('src');await act(async()=>[...document.querySelectorAll('.roster-art-variants button')].find(b=>b.getAttribute('aria-pressed')==='false').click());
  assert.notEqual(document.querySelector('.roster-detail-art img').getAttribute('src'),femaleArt);assert.equal(document.querySelector('.roster-skill-table dd').textContent,'23%');assert.equal(document.querySelector('[aria-label="스킬 레벨"]').value,'1');
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
});
