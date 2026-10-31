import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';
import React,{act} from 'react';import {JSDOM} from 'jsdom';
import inventory from '../content/roster-detail-icons.json' with {type:'json'};
const {pinRosterFactIcons}=await import('../lib/roster-detail-icons.ts');
const {promotionValue,progressionRows}=await import('../lib/roster-progression.ts');
const {rosterCharacterSchema}=await import('../lib/character-roster.ts');
const {default:RosterStatDetails}=await import('../components/roster-stat-details.tsx');
const C=s=>({ko:s,en:s,ja:s,zh:s}),url='https://example.org/source',icon='https://example.org/native.png';
function fixture(){return {id:'exact-form',name:C('Character'),sourceUrl:url,sourceKind:'community',
 stats:[{id:'hp',label:C('HP'),value:'2',basis:C('Base'),icon}],
 statProgression:{sourceUrl:url,sourceKind:'community',basis:C('No gear'),stageLabel:C('돌파'),
  stats:[{id:'hp',label:C('HP'),format:'floor',icon}],stages:[{id:0,label:C('돌파 0')}],
  rows:[{stage:0,level:1,values:{hp:'2'}},{stage:0,level:4,values:{hp:'3'}}],
  linear:{formula:'starrail-promotion',stages:[{stage:0,minLevel:1,maxLevel:4,base:{hp:'2.58'},step:{hp:'0.14'}}]}},
 skillTables:[{id:'skill',name:C('Skill'),type:C('특성'),sourceUrl:url,sourceKind:'community',basis:C('Source'),icon,
  descriptionTemplate:C('Damage {1}%'),parameters:{en:[['25','50','75']]},baseMaxLevel:2,maxLevel:3,values:[{id:'bonus',label:C('Bonus'),icon,levels:['5%']}]}]};}
test('exact source decimals floor integer boundaries and retain every intermediate promotion level',()=>{
 const p=fixture().statProgression,s=p.linear.stages[0];
 assert.equal(promotionValue(s,'hp',4,'floor'),'3');assert.deepEqual(progressionRows(p,0).map(r=>r.values.hp),['2','2','2','3']);
 assert.throws(()=>promotionValue({...s,base:{hp:'.05'},step:{hp:'0'}},'hp',1,'percent'),/coefficient/);
});
test('formula schema rejects unbound coefficients, missing endpoints and altered checkpoints',()=>{
 assert.equal(rosterCharacterSchema.safeParse(fixture()).success,true);
 for(const mutate of [c=>c.statProgression.rows.pop(),c=>c.statProgression.rows[1].values.hp='2',c=>delete c.statProgression.linear.stages[0].step.hp,c=>c.statProgression.linear.stages[0].base.hp='1e5',c=>delete c.statProgression.stats[0].format,c=>c.skillTables[0].baseMaxLevel=4]){
  const c=fixture();mutate(c);assert.equal(rosterCharacterSchema.safeParse(c).success,false);
 }
 const s=fixture().statProgression.linear.stages[0];assert.throws(()=>promotionValue(s,'hp',5,'floor'),/outside/);assert.throws(()=>promotionValue({...s,base:{hp:'-1'}},'hp',1,'floor'),/coefficient/);
 assert.equal(promotionValue({...s,base:{hp:'0.05'},step:{hp:'0'}},'hp',1,'percent'),'5%');
});
test('only exact same-game glyphs are pinned, preserving text, stats, source provenance and owner artwork',()=>{
 const a=inventory[0],c=fixture();c.stats[0].icon=a.url;c.statProgression.stats[0].icon=a.url;c.skillTables[0].icon=a.url;c.skillTables[0].values[0].icon=a.url;c.image={url:'https://example.org/owner-art.png',sourceUrl:url,kind:'splash'};const before=structuredClone(c);
 const p=pinRosterFactIcons(c,a.gameId);assert.equal(p.stats[0].icon,a.publicUrl);assert.equal(p.statProgression.stats[0].icon,a.publicUrl);assert.equal(p.skillTables[0].icon,a.publicUrl);assert.equal(p.skillTables[0].values[0].icon,a.publicUrl);assert.equal(p.stats[0].value,c.stats[0].value);assert.deepEqual(p.image,c.image);assert.equal(p.skillTables[0].sourceUrl,url);assert.deepEqual(c,before);assert.deepEqual(pinRosterFactIcons(c,'unrelated-game'),c);
});
test('mounted level and skill controls update facts, retain native glyphs and recover safely from failed images',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),saved=new Map();
 const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};
 for(const k of ['window','document','HTMLElement','Element','Node','Event'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);
 const {createRoot}=await import('react-dom/client');let root;
 try{
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(RosterStatDetails,{character:fixture(),locale:'ko',service:'global'}))});
  const level=document.querySelector('select[aria-label="캐릭터 레벨"]');assert.equal(level.options.length,4);assert.equal(document.querySelector('.roster-stats dd').textContent,'3');
  await act(async()=>{level.value='2';level.dispatchEvent(new Event('change',{bubbles:true}))});assert.equal(document.querySelector('.roster-stats dd').textContent,'2');
  const skill=document.querySelector('select[aria-label="Skill · 스킬 레벨"]');assert.match(skill.options[2].textContent,/성혼 보너스 포함/);
  await act(async()=>{skill.value='3';skill.dispatchEvent(new Event('change',{bubbles:true}))});assert.equal(document.querySelector('.roster-skill-description').textContent,'Damage 75%');
  assert.equal(document.querySelector('.roster-skill-table dt img').getAttribute('src'),icon);
  await act(async()=>document.querySelector('.roster-stats dt img').dispatchEvent(new Event('error')));assert.equal(document.querySelector('.roster-stats dt img'),null);assert.ok(document.querySelector('.roster-stats dt svg'));assert.equal(document.querySelector('.roster-stats dd').textContent,'2');
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
});
