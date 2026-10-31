import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import React,{act} from 'react';import {JSDOM} from 'jsdom';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
const model=await import('../lib/character-roster.ts'),{CharacterFacts}=await import('../components/character-roster.tsx');
const copy=s=>({ko:s,en:s,ja:s,zh:s}),source=bootstrap.find(r=>r.gameId==='endfield');
function stagedFixture(){
 const c=structuredClone(source.characters.find(c=>c.id==='endministrator1')),basis=copy('Raw source values; no weapon or gear');
 c.stats=[{id:'hp',label:copy('Legacy label'),value:'999',basis},{id:'str',label:copy('STR'),value:'50',basis}];
 c.statProgression={sourceUrl:c.sourceUrl,sourceKind:'community',basis,stats:[{id:'hp',label:copy('HP'),basis:copy('HP basis')},{id:'str',label:copy('STR'),group:'detail'}],stages:[{id:0,label:copy('정예화 전')},{id:1,label:copy('정예화 1')}],rows:[{level:20,stage:0,values:{hp:'100',str:'10'}},{level:20,stage:1,values:{hp:'125',str:'12'}},{level:40,stage:1,values:{hp:'200',str:'20'}}]};
 c.skillTables=[{id:'native-skill',name:copy('Skill'),type:copy('Battle Skill'),sourceUrl:c.sourceUrl,sourceKind:'community',basis,maxLevel:12,levelLabels:Array.from({length:12},(_,i)=>copy(i<9?'Lv.'+(i+1):'M'+(i-8))),descriptionTemplate:copy('Damage {1}'),parameters:{en:[Array.from({length:12},(_,i)=>String(i+1)+'%')]},values:[]}];
 return c;
}
test('promotion identity preserves both sides of level boundaries and rejects incomplete rows and rank labels',()=>{
 const c=stagedFixture();assert.ok(model.rosterCharacterSchema.safeParse(c).success);
 c.statProgression.rows.push(structuredClone(c.statProgression.rows[0]));assert.equal(model.rosterCharacterSchema.safeParse(c).success,false);c.statProgression.rows.pop();
 delete c.statProgression.rows[0].values.str;assert.equal(model.rosterCharacterSchema.safeParse(c).success,false);c.statProgression.rows[0].values.str='10';
 c.statProgression.rows[0].stage=9;assert.equal(model.rosterCharacterSchema.safeParse(c).success,false);c.statProgression.rows[0].stage=0;
 c.skillTables[0].levelLabels.pop();assert.equal(model.rosterCharacterSchema.safeParse(c).success,false);
});
test('mounted promotion and mastery controls keep exact rows, source labels and secondary attributes separate',async()=>{
 const c=stagedFixture(),dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/ko/games/endfield/characters/endministrator1',pretendToBeVisual:true}),saved=new Map();
 const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};for(const k of ['window','document','HTMLElement','HTMLSelectElement','Element','Node','Event','MouseEvent'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);const {createRoot}=await import('react-dom/client');let root;
 const change=async(selector,value)=>act(async()=>{const el=document.querySelector(selector);Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,String(value));el.dispatchEvent(new Event('change',{bubbles:true}));});
 try{
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(CharacterFacts,{character:c,locale:'ko',service:'global'}));});
  assert.equal(document.querySelector('[aria-label="정예화"]').value,'1');assert.equal(document.querySelector('[aria-label="캐릭터 레벨"]').value,'40');assert.equal(document.querySelector('.roster-stats>dl dt').textContent,'HP');assert.equal(document.querySelector('.roster-stats>dl dd').textContent,'200');assert.match(document.querySelector('.roster-combat-stats').textContent,/STR/);
  await change('[aria-label="캐릭터 레벨"]',20);assert.equal(document.querySelector('.roster-stats>dl dd').textContent,'125');
  await change('[aria-label="정예화"]',0);assert.equal(document.querySelector('[aria-label="캐릭터 레벨"]').value,'20');assert.equal(document.querySelector('.roster-stats>dl dd').textContent,'100');
  const select=document.querySelector('[aria-label="Skill · 스킬 레벨"]');assert.deepEqual([...select.options].slice(-3).map(o=>o.textContent),['M1','M2','M3']);await change('[aria-label="Skill · 스킬 레벨"]',12);assert.equal(document.querySelector('.roster-skill-description').textContent,'Damage 12%');
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
});

const fixture=JSON.parse((await import('node:fs')).readFileSync(new URL('./fixtures/endfield/independent-samples.json',import.meta.url),'utf8'));
const receipts=JSON.parse((await import('node:fs')).readFileSync(new URL('../ops/character-rosters/enrichment/endfield/detail-manifest.json',import.meta.url),'utf8'));
const nativeToPublic=new Map(receipts.reviewedBindings.map(b=>[b.nativeId,b.id]));
test('released Endfield forms match independent panels and all sampled native skill coefficients',()=>{
 assert.ok(model.characterRosterSchema.safeParse(source).success);let panels=0,coefficients=0;
 for(const sample of fixture.characters){
  const c=source.characters.find(c=>c.id===nativeToPublic.get(sample.nativeId));assert.ok(c);
  for(const expected of sample.samples){const row=c.statProgression.rows.find(r=>r.level===expected.level&&r.stage===expected.stage);assert.ok(row);for(const[key,value]of Object.entries(expected.display)){assert.equal(row.values[key==='will'?'wil':key],value,c.id+' '+key);panels++}}
  for(const group of sample.allSkillGroups){const table=c.skillTables.find(t=>t.id===group.nativeGroupId);assert.ok(table);assert.equal(table.name.ko,group.nameKo);
   for(const skill of group.skills)for(const rank of skill.ranks)rank.subDescriptions.forEach((v,i)=>{const value=table.values.find(v=>v.id===skill.nativeSkillId+':'+i);assert.ok(value,skill.nativeSkillId+':'+i);assert.equal(value.levels[rank.level-1],typeof v==='string'?v:v.desc);coefficients++})
  }
 }
 assert.equal(panels,392);assert.equal(coefficients,640);
 const detailed=source.characters.filter(c=>c.statProgression);assert.equal(detailed.length,34);assert.equal(detailed.reduce((n,c)=>n+c.statProgression.rows.length,0),3196);
 for(const c of detailed){assert.equal(c.statProgression.rows.length,94);assert.equal(c.skillTables.length,4);for(const t of c.skillTables){assert.equal(t.maxLevel,12);assert.equal(t.levelLabels.at(-1).ko,'M3')}for(const s of c.sections)for(const l of ['ko','en','ja','zh'])assert.ok(s.body[l]);}
 const future=source.characters.find(c=>c.id==='minghe');assert.equal(future.statProgression,undefined);assert.equal(future.potentialRewards,undefined);
 assert.equal(source.characters.reduce((n,c)=>n+(c.potentialRewards||[]).filter(r=>r.type==='illustration').length,0),101);assert.equal(source.characters.reduce((n,c)=>n+(c.potentialRewards||[]).filter(r=>r.type==='namecard').length,0),17);assert.equal(source.characters.reduce((n,c)=>n+(c.potentialRewards||[]).filter(r=>r.image).length,0),99);
 for(const id of ['endministrator1','endministrator2'])assert.ok(source.characters.find(c=>c.id===id).potentialRewards.every(r=>r.level<5));assert.ok(source.characters.find(c=>c.id==='endministrator1').potentialRewards.every(r=>r.image));assert.ok(source.characters.find(c=>c.id==='endministrator2').potentialRewards.every(r=>!r.image));
 const summary=source.characters.map(model.rosterSummary);for(const c of summary){assert.equal(c.statProgression,undefined);assert.equal(c.skillTables,undefined);assert.equal(c.potentialRewards,undefined);assert.equal(c.detailSources,undefined)}
});
test('sparse old snapshots retain reviewed Endfield facts alongside same-ID source and owner sections',async()=>{
 const {retainCharacterFacts}=await import('../lib/character-roster-enrichment.ts');const extra=source.characters.find(c=>c.id==='perlica'),old={...extra,sections:[{id:'owner-notes',title:copy('Owner notes'),body:copy('Preserved owner note')}],potentialRewards:undefined,skillTables:undefined,statProgression:undefined};const c=retainCharacterFacts(old,extra);
 assert.ok(c.sections.some(s=>s.id==='owner-notes'));assert.ok(c.sections.some(s=>s.id==='endfield-detail-potential-1'));assert.deepEqual(c.potentialRewards,extra.potentialRewards);assert.deepEqual(c.statProgression,extra.statProgression);
});
test('potential rewards mount images only after their stage opens and preserve conditional rewards',async()=>{
 const {default:Rewards}=await import('../components/roster-potential-rewards.tsx'),c=source.characters.find(c=>c.id==='perlica'),dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),saved=new Map();
 for(const k of ['window','document','HTMLElement','Element','Node','Event']){saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:dom.window[k],writable:true,configurable:true})}saved.set('IS_REACT_ACT_ENVIRONMENT',Object.getOwnPropertyDescriptor(globalThis,'IS_REACT_ACT_ENVIRONMENT'));Object.defineProperty(globalThis,'IS_REACT_ACT_ENVIRONMENT',{value:true,writable:true,configurable:true});const {createRoot}=await import('react-dom/client');let root;
 try{
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(Rewards,{character:c,locale:'ko'}))});assert.equal(document.querySelectorAll('img').length,0);assert.equal(document.querySelectorAll('details').length,3);
  const stage=document.querySelector('details');await act(async()=>{stage.open=true;stage.dispatchEvent(new Event('toggle'))});assert.equal(stage.querySelectorAll('img').length,2);assert.match(stage.textContent,/별도 기념 이벤트/);assert.match(stage.textContent,/공개 가이드 제공본/);assert.ok([...stage.querySelectorAll('img')].every(i=>i.getAttribute('src').startsWith('/roster-bootstrap/')));
  await act(async()=>{stage.open=false;stage.dispatchEvent(new Event('toggle'))});assert.equal(document.querySelectorAll('img').length,0);
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
});
