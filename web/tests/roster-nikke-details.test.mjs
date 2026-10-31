import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
const {characterRosterSchema,rosterSummary}=await import('../lib/character-roster.ts');
const {rosterSkillDescription}=await import('../lib/character-roster-metrics.ts');

const data=bootstrap.find(r=>r.gameId==='nikke');
test('sparse production base art and a single costume retain a return choice and selected levels',async()=>{
 const character=structuredClone(data.characters.find(c=>c.id==='1'));
 delete character.image.variantId;delete character.image.variantLabel;
 character.images=character.images.filter(a=>a.variantId).slice(0,1);
 const dom=new JSDOM('<div id="root"></div>',{url:'https://gagether.wiki',pretendToBeVisual:true}),saved=new Map();
 const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true})};
 for(const k of ['window','document','HTMLElement','HTMLDialogElement','Element','Node','Event'])set(k,dom.window[k]);set('IS_REACT_ACT_ENVIRONMENT',true);
 const {createRoot}=await import('react-dom/client'),{CharacterFacts}=await import('../components/character-roster.tsx');let root;
 try{
  await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(CharacterFacts,{character,locale:'ko',service:'global'}))});
  const buttons=[...document.querySelectorAll('.roster-art-variants button')];assert.equal(buttons.length,2);assert.equal(buttons[0].textContent,'기본');
  await act(async()=>{for(const [label,value]of [['캐릭터 레벨','1'],['치어리딩 · 스킬 레벨','10']]){const select=document.querySelector('select[aria-label="'+label+'"]');select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));}});
  const original=document.querySelector('.roster-detail-art img').src;
  await act(async()=>buttons[1].click());assert.notEqual(document.querySelector('.roster-detail-art img').src,original);
  assert.equal(document.querySelector('select[aria-label="캐릭터 레벨"]').value,'1');assert.match(document.querySelector('.roster-skill-description').textContent,/10\.77%/);
  await act(async()=>buttons[0].click());assert.equal(document.querySelector('.roster-detail-art img').src,original);assert.equal(buttons[0].getAttribute('aria-pressed'),'true');
 }finally{if(root)await act(async()=>root.unmount());dom.window.close();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}}
});
test('NIKKE exact identities keep sourced growth, all three rank tables and separate costume originals',()=>{
 characterRosterSchema.parse(data);
 assert.equal(data.characters.length,203);assert.ok(Buffer.byteLength(JSON.stringify(data))<4400000);
 for(const c of data.characters){
  assert.equal(c.skillTables.length,3);assert.equal(c.statProgression.rows.length,21);
  assert.equal(c.statProgression.rows[0].level,1);assert.equal(c.statProgression.rows.at(-1).level,200);
  assert.equal(c.image.variantId,'default');assert.ok(c.images.every(a=>!a.variantId||a.variantId.startsWith('costume-')));
  for(const s of c.skillTables){
   assert.equal(s.maxLevel,10);assert.equal(s.sourceUrl,c.sourceUrl);assert.equal(s.sourceKind,'community');
   for(const locale of ['ko','en','ja','zh'])for(const rank of [1,10])assert.doesNotMatch(rosterSkillDescription(s,locale,rank),/\{[^}]+\}|<\/?(?:color|word_group)/);
  }
  assert.equal(rosterSummary(c).skillTables,undefined);assert.equal(rosterSummary(c).statProgression,undefined);
 }
 const emma=data.characters.find(c=>c.id==='1');
 assert.match(rosterSkillDescription(emma.skillTables[0],'ko',1),/5\.92%/);
 assert.match(rosterSkillDescription(emma.skillTables[0],'ko',10),/10\.77%/);
 assert.equal(emma.statProgression.rows.at(-1).values.hp,'527303');
 assert.equal(emma.skillTables[2].values.find(v=>v.id==='cooldown').levels[9],'40 s');
});

test('normal NIKKE enrichment validates exact native IDs/ranks, labels missing locales and preserves facts on failure',()=>{
 const script=String.raw`
import sys,json,copy
sys.path.insert(0,'ops/character-rosters/enrichment')
from nikke_details import patch
from enrich_a import detail_rows
b=json.load(open('content/character-rosters/bootstrap.json'))
c=next(c for d in b if d['gameId']=='nikke'for c in d['characters']if c['id']=='1')
raw=json.load(open('tests/fixtures/nikke/emma.json'));before=copy.deepcopy(c)
p=patch(c,raw);assert c==before
assert patch({**c,**p},raw)==p
for mutate in ['id','values','slot']:
 d=copy.deepcopy(raw)
 if mutate=='id':d['id']+=1
 if mutate=='values':d['details']['skills'][0]['values'][0]=['5.92']
 if mutate=='slot':d['details']['skills'].pop()
 try:patch(c,d)
 except ValueError:pass
 else:raise AssertionError('Invalid '+mutate+' accepted')
d=copy.deepcopy(raw);d['details']['skills'][0]['name'].pop('ja');d['details']['skills'][0]['descriptionTemplate'].pop('ja')
missing=patch(c,d)['skillTables'][0];assert missing['name']['ja']==''and missing['descriptionTemplate']['ja']==''
doc={'characters':[copy.deepcopy(c)]}
def fail(_):raise ValueError('source unavailable')
count,errors=detail_rows(doc,None,fail);assert count==0 and len(errors)==1 and doc['characters']==[before]
print('Exact identity, complete rank binding, idempotence, labelled locale gaps and last-good preservation passed')
`;
 const r=spawnSync('python',['-c',script],{cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:10000});
 assert.equal(r.status,0,r.stderr||r.stdout);
});
