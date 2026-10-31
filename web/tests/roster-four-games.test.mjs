import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import React,{act} from 'react';import {JSDOM} from 'jsdom';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
const {characterRosterSchema,rosterCharacterSchema,rosterDirectory,rosterArt}=await import('../lib/character-roster.ts'),{hydrateRosterDetails}=await import('../lib/roster-detail-catalog.ts'),{enrichCharacterRoster}=await import('../lib/character-roster-enrichment.ts'),{CharacterFacts}=await import('../components/character-roster.tsx');
const games={genshin:124,reverse1999:136,limbus:190,trickcal:136};
test('four exact rosters retain their identities and deferred details without inflating directory responses',async()=>{
 for(const [id,count]of Object.entries(games)){
  const data=bootstrap.find(r=>r.gameId===id);characterRosterSchema.parse(data);assert.equal(data.characters.length,count);assert.equal(data.detailCatalog.version,3);assert.equal(Object.keys(data.detailCatalog.forms).length,count);
  const directory=rosterDirectory(data);assert.equal(directory.detailCatalog,undefined);assert.ok(Buffer.byteLength(JSON.stringify(directory))<1_000_000);
  for(const c of directory.characters)for(const field of ['stats','skillTables','regionalSkillTables','sections','variantDetails','statProgression'])assert.equal(c[field],undefined);
  let tables=0;for(const c of data.characters){const full=rosterCharacterSchema.parse(await hydrateRosterDetails(data,c));assert.equal(full.id,c.id);assert.equal(full.sourceId,c.sourceId);tables+=(full.skillTables?.length||0)+Object.values(full.regionalSkillTables||{}).reduce((n,s)=>n+s.length,0)+Object.values(full.variantDetails||{}).reduce((n,s)=>n+(s.skillTables?.length||0),0);}
  assert.ok(tables>400,id+' complete native skill coverage');if(id!=='limbus')assert.ok(data.characters.every(c=>c.image));
 }
});
test('new game packed blocks reject corrupt data and exact source identity substitution',async()=>{
 for(const id of Object.keys(games)){
  const original=bootstrap.find(r=>r.gameId===id),data=structuredClone(original),c=data.characters[0],f=data.detailCatalog.forms[c.id];f.sha256='0'.repeat(64);await assert.rejects(hydrateRosterDetails(data,c),/hash mismatch/);
  f.sha256=original.detailCatalog.forms[c.id].sha256;f.sourceId='unrelated';assert.equal(characterRosterSchema.safeParse(data).success,false);
 }
});
test('sparse saved games recover new exact details and reviewed legacy art but preserve unknown source replacements',async()=>{
 for(const id of Object.keys(games)){
  const source=bootstrap.find(r=>r.gameId===id),data=structuredClone(source);delete data.detailCatalog;for(const c of data.characters){delete c.sourceId;c.stats=[];delete c.images;}
  const saved=enrichCharacterRoster(data);assert.ok(saved.detailCatalog);assert.equal(saved.characters.length,games[id]+(id==='limbus'?2:0));const c=await hydrateRosterDetails(saved,saved.characters[0]);assert.ok(c.skillTables?.length||c.regionalSkillTables||c.variantDetails);
  const incoming=structuredClone(data);incoming.characters[0].image={url:'https://example.org/new-reviewed-source.png',sourceUrl:'https://example.org/source',kind:'splash'};assert.equal(enrichCharacterRoster(incoming).characters.find(c=>c.id===incoming.characters[0].id).image.url,'https://example.org/new-reviewed-source.png');
 }
});
test('Traveler elements change their own facts and icons while keeping the one exact character illustration',async()=>{
 const data=bootstrap.find(r=>r.gameId==='genshin'),raw=data.characters.find(c=>c.id==='10000005'),traveler=await hydrateRosterDetails(data,raw),variants=Object.entries(traveler.variantDetails);assert.equal(variants.length,7);assert.ok(variants.every(([,v])=>v.label&&v.traits?.some(t=>t.icon)&&v.skillTables.length));
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/ko/games/genshin/characters/10000005',pretendToBeVisual:true}),saved=new Map(),set=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true})};for(const key of ['window','document','HTMLElement','Element','Node','Event','MouseEvent'])set(key,dom.window[key]);set('IS_REACT_ACT_ENVIRONMENT',true);const {createRoot}=await import('react-dom/client');let root;
 try{await act(()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(CharacterFacts,{character:traveler,locale:'ko',service:'global',gameId:'genshin'}));});const before=document.querySelector('.roster-detail-art img').getAttribute('src'),buttons=[...document.querySelectorAll('.roster-fact-variants button')];assert.equal(buttons.length,7);assert.equal(buttons.filter(b=>b.getAttribute('aria-pressed')==='true').length,1);const last=variants.at(-1);await act(()=>buttons.at(-1).click());assert.equal(buttons.at(-1).getAttribute('aria-pressed'),'true');assert.ok(document.querySelector('.roster-skill-tables').textContent.includes(last[1].skillTables[0].name.ko));assert.equal(document.querySelector('.roster-detail-art img').getAttribute('src'),before);
 }finally{if(root)await act(()=>root.unmount());dom.window.close();for(const[key,value]of saved)value?Object.defineProperty(globalThis,key,value):delete globalThis[key];}
});

test('a shared multilingual official poster keeps each declared language without leaking into another locale',async()=>{
 const data=enrichCharacterRoster(bootstrap.find(r=>r.gameId==='limbus')),c=data.characters.find(c=>c.id==='195'),full=await hydrateRosterDetails(data,c);
 for(const locale of ['ko','en','ja']){const art=rosterArt(full,locale,'global');assert.ok(art);assert.equal(art.locale,locale);assert.match(art.url,/326ce33e8a999d22971325185ddb5d5ba0b2e2be/);}
 assert.equal(rosterArt(full,'zh','global'),undefined);
});
