import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import React,{act} from 'react';import {JSDOM} from 'jsdom';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
import samples from './fixtures/bluearchive/base-stat-samples.json' with {type:'json'};
import {renderToString} from 'react-dom/server';
const model=await import('../lib/character-roster.ts'),metrics=await import('../lib/character-roster-metrics.ts'),{enrichCharacterRoster}=await import('../lib/character-roster-enrichment.ts'),{CharacterFacts}=await import('../components/character-roster.tsx');
const ba=bootstrap.find(r=>r.gameId==='bluearchive'),copy=text=>({ko:text,en:text,ja:text,zh:text}),bonus={MaxHP:'hp',AttackPower:'attack',DefensePower:'none',HealPower:'healing'};

test('Blue Archive base panels match independent upstream calculator samples at natural and five stars',()=>{
 for(const student of samples)for(const sample of student.samples){
  const growth={formula:'schaledb-standard',minLevel:1,maxLevel:90,starGrade:sample.stars,stats:Object.entries(student.raw).map(([id,[base,anchor]])=>({id,label:copy(id),base,anchor,bonus:bonus[id]}))};
  for(const stat of growth.stats)assert.equal(metrics.rosterGrowthValue(growth,stat,sample.level),String(sample.values[stat.id]),student.id+' '+sample.level+' '+sample.stars+' '+stat.id);
  assert.throws(()=>metrics.rosterGrowthValue(growth,growth.stats[0],100),/source range/);
 }
});
test('native skill parameter matrices retain locale-specific ordering and reject unbound or truncated levels',()=>{
 const c=structuredClone(ba.characters[0]);c.skillTables=[{id:'fixture',name:copy('Skill'),type:copy('EX'),sourceUrl:c.sourceUrl,sourceKind:'community',basis:copy('Lv.1–5'),maxLevel:5,descriptionTemplate:{ko:'피해 {1}, 시간 {2}',en:'{1} damage for {2}',ja:'時間{1}、ダメージ{2}',zh:'伤害{1}、时间{2}'},parameters:{en:[['10%','20%','30%','40%','50%'],['5s']],ja:[['5秒'],['10%','20%','30%','40%','50%']]},values:[]}];
 assert.ok(model.rosterCharacterSchema.safeParse(c).success);const s=c.skillTables[0];
 assert.equal(metrics.rosterSkillDescription(s,'ko',5),'피해 50%, 시간 5s');assert.equal(metrics.rosterSkillDescription(s,'ja',5),'時間5秒、ダメージ50%');
 s.parameters.ja[1].pop();assert.equal(model.rosterCharacterSchema.safeParse(c).success,false);s.parameters.ja[1].push('50%');s.descriptionTemplate.zh='{9}';assert.equal(model.rosterCharacterSchema.safeParse(c).success,false);
});
test('all Blue Archive forms retain identity and detailed facts while initial lists remain small',()=>{
 assert.equal(ba.characters.length,278);assert.equal(ba.characters.filter(c=>c.statGrowth).length,278);assert.equal(ba.characters.filter(c=>c.skillTables?.length>=4).length,278);
 assert.equal(ba.characters.filter(c=>c.skillTables?.some(s=>s.descriptionTemplate)).length,274);
 for(const c of ba.characters){assert.ok(model.rosterCharacterSchema.safeParse(c).success,c.id);const summary=model.rosterSummary(c);for(const key of ['statGrowth','skillTables','stats','sections'])assert.ok(!(key in summary));assert.equal(c.statGrowth.maxLevel,90);assert.equal(c.statGrowth.starGrade,c.rarity);}
 const sparse=structuredClone(ba);for(const c of sparse.characters){delete c.statGrowth;delete c.skillTables;c.stats=c.stats.slice(0,4);}
 assert.ok(enrichCharacterRoster(sparse).characters.every(c=>c.statGrowth&&c.skillTables.length>=4));
});
test('mounted Blue Archive EX and basic skills use separate rank limits, native effects and scoped upgrades',async()=>{
 const aru=ba.characters.find(c=>c.id==='10000'),dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki/ko/games/bluearchive/characters/10000',pretendToBeVisual:true}),saved=new Map();
 const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};for(const k of ['window','document','HTMLElement','HTMLSelectElement','Element','Node','Event','MouseEvent'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);const {createRoot}=await import('react-dom/client');let root;
 const change=async(selector,value)=>act(async()=>{const el=document.querySelector(selector);Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,String(value));el.dispatchEvent(new Event('change',{bubbles:true}));});
 try{
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(CharacterFacts,{character:aru,locale:'ko',service:'kr'}));});
  assert.equal(document.querySelector('[aria-label="캐릭터 레벨"]').value,'90');assert.equal(document.querySelector('.roster-stats dd').textContent,'19776');
  await change('[aria-label="캐릭터 레벨"]',1);assert.equal(document.querySelector('.roster-stats dd').textContent,'2505');
  const ex='[aria-label="하드보일드 샷 · 스킬 레벨"]',basic='[aria-label="느와르 어택 · 스킬 레벨"]';assert.equal(document.querySelector(ex).options.length,5);assert.equal(document.querySelector(basic).options.length,10);
  assert.match(document.querySelector('.roster-skill-description').textContent,/274%/);await change(ex,5);assert.match(document.querySelector('.roster-skill-description').textContent,/521%/);assert.match(document.querySelector('.roster-skill-description').textContent,/554%/);assert.equal(document.querySelector(basic).value,'1');
  await change(basic,10);const text=document.querySelector('[aria-label="느와르 어택 · 스킬 레벨"]').closest('details').querySelector('.roster-skill-description').textContent;assert.match(text,/290%/);assert.match(text,/476%/);
  assert.ok(document.querySelector('.roster-combat-stats'));assert.ok(!document.querySelector('.roster-detail-body').textContent.includes('<?'));
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
});
test('unreleased service upgrades stay scoped and the newest ranged originals never gain invented rank selectors',()=>{
 const student=ba.characters.find(c=>c.id==='23005'),upgrade=student.skillTables.find(s=>s.id==='ba-GearPublic');assert.deepEqual(upgrade.regions,['jp']);
 const render=(character,service)=>new JSDOM(renderToString(React.createElement(CharacterFacts,{character,service,locale:'ko'})));
 const global=render(student,'kr'),jp=render(student,'jp');const names=dom=>[...dom.window.document.querySelectorAll('.roster-skill-table strong')].map(e=>e.textContent);
 assert.ok(!names(global).includes(upgrade.name.ko));assert.ok(names(jp).includes(upgrade.name.ko));global.window.close();jp.window.close();
 const anna=ba.characters.find(c=>c.id==='10151'),dom=render(anna,'jp');assert.equal(dom.window.document.querySelectorAll('.roster-skill-table').length,4);assert.equal(dom.window.document.querySelectorAll('.roster-skill-tables select').length,0);assert.match(dom.window.document.querySelector('.roster-skill-table small').textContent,/원문 · EN/);assert.equal(dom.window.document.querySelector('.roster-skill-description').textContent,anna.skillTables[0].description.en);dom.window.close();
 const aru=ba.characters.find(c=>c.id==='10000');assert.match(metrics.rosterSkillDescription(aru.skillTables.find(s=>s.id==='ba-WeaponPassive'),'ko',1),/20%p/);
});
