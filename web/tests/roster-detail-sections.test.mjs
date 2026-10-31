import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
const {hydrateRosterDetails}=await import('../lib/roster-detail-catalog.ts'),{rosterDetailSections}=await import('../lib/roster-detail-sections.ts'),{CharacterFacts}=await import('../components/character-roster.tsx'),{rosterArt}=await import('../lib/character-roster.ts');
const copy=ko=>({ko,en:'',ja:'',zh:''});
test('saved exact migrated skill prose renders once while different notes, source facts and other-service sections survive',async()=>{
 const r=bootstrap.find(r=>r.gameId==='trickcal'),c=await hydrateRosterDetails(r,r.characters.find(c=>c.id==='alice')),tables=c.regionalSkillTables.kr;
 c.sections=tables.map(t=>({id:'legacy-'+t.id,title:t.type,body:copy(t.name.ko==='일반 공격'?t.description.ko:t.name.ko+'\n'+t.description.ko),regions:['kr']}));
 const unchanged=structuredClone(c);assert.equal(rosterDetailSections(c,'ko','kr').length,0);assert.deepEqual(c,unchanged);
 const extra={id:'owner-condition',title:tables[0].type,body:copy(tables[0].description.ko+'\n추가 조건: 보스에게만 적용'),regions:['kr']};c.sections.push(extra);
 assert.deepEqual(rosterDetailSections(c,'ko','kr'),[extra]);
 const html=renderToStaticMarkup(React.createElement(CharacterFacts,{character:c,locale:'ko',service:'kr',gameId:'trickcal'}));assert.equal((html.match(/class="roster-fact-section"/g)||[]).length,1);assert.match(html,/추가 조건/);assert.match(html,/아르카나/);
 const foreign={...extra,id:'global-note',regions:['global']};c.sections.push(foreign);assert.ok(rosterDetailSections(c,'ko','global').some(s=>s.id==='global-note'));
});
test('native Trickcal hero-icon cards keep complete source pixels and cannot be relabeled full illustrations by stale snapshots',()=>{
 const r=bootstrap.find(r=>r.gameId==='trickcal');const cards=r.characters.filter(c=>c.image?.url.includes('/sprites/rawsprites/heroicons/'));assert.equal(cards.length,134);
 for(const c of cards){assert.equal(c.image.kind,'card');assert.equal(rosterArt({...c,image:{...c.image,kind:'full-body'}},'ko','kr').kind,'card');}
});
