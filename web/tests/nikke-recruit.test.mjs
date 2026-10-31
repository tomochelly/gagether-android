import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
import manifest from '../content/nikke-recruit-pool.json' with {type:'json'};
const {createNikkeRecruitCatalog}=await import('../lib/nikke-recruit-catalog.ts');
const {NIKKE_DENOMINATOR,recruitInteger,recruitWeight,recruitTicket,validateRecruitCatalog,emptyRecruitPractice,parseRecruitPractice,commitRecruitPractice,completeRecruitPractice}=await import('../lib/nikke-recruit.ts');
const {enrichCharacterRoster}=await import('../lib/character-roster-enrichment.ts');
export const catalog=createNikkeRecruitCatalog(enrichCharacterRoster(bootstrap.find(r=>r.gameId==='nikke')));
test('fixed current pool reconciles 206 gallery units to 145 recruits without excluding ordinary Pilgrims',()=>{
 assert.equal(catalog.characters.length,145);assert.equal(catalog.featured,'230');
 assert.deepEqual(['SSR','SR','R'].map(r=>catalog.characters.filter(c=>c.rank===r).length),[127,9,9]);
 for(const id of ['172','191','219','220'])assert.ok(catalog.characters.some(c=>c.id===id),id);
 for(const id of ['229','231','71','72','73','81'])assert.ok(!catalog.characters.some(c=>c.id===id),id);
 assert.deepEqual(new Set(catalog.characters.map(c=>c.id)),new Set(manifest.ids));
 assert.throws(()=>validateRecruitCatalog({...catalog,characters:catalog.characters.slice(1)}));
});
test('all 12600 exact tickets reproduce rank totals and every individual rate without rounded-weight drift',()=>{
 const seen=new Map();for(let i=0;i<NIKKE_DENOMINATOR;i++){const id=recruitTicket(catalog,i).id;seen.set(id,(seen.get(id)||0)+1);}
 assert.equal(seen.size,145);for(const c of catalog.characters)assert.equal(seen.get(c.id),recruitWeight(c,catalog.featured));
 assert.deepEqual(['SSR','SR','R'].map(r=>catalog.characters.filter(c=>c.rank===r).reduce((s,c)=>s+seen.get(c.id),0)),[504,5418,6678]);
 assert.equal(seen.get('230'),126);for(const n of [-1,12600,NaN,.5])assert.throws(()=>recruitTicket(catalog,n));
});
test('uniform integer rejection and independent ten pulls do not invent a pity or guaranteed SR',()=>{
 let calls=0;assert.equal(recruitInteger(12600,()=>++calls===1?0xffffffff:12601),1);assert.equal(calls,2);
 for(const value of [-1,NaN,2**32,.5])assert.throws(()=>recruitInteger(12600,()=>value));
 const firstR=catalog.characters.findIndex(c=>c.rank==='R'),ticket=catalog.characters.slice(0,firstR).reduce((s,c)=>s+recruitWeight(c,catalog.featured),0);
 const before=emptyRecruitPractice(catalog.poolId),next=commitRecruitPractice(before,catalog,'ten',10,false,()=>ticket);
 assert.equal(next.batches[0].characters.length,10);assert.ok(next.batches[0].characters.every(id=>catalog.characters.find(c=>c.id===id).rank==='R'));assert.equal(next.mileage,10);assert.equal(before.draws,0);
});
test('pending reload, completion and replay are idempotent and malformed stored data is preserved',()=>{
 let s=commitRecruitPractice(emptyRecruitPractice(catalog.poolId),catalog,'one',1,false,()=>0),raw=JSON.stringify(s);
 assert.deepEqual(parseRecruitPractice(raw,catalog),s);assert.equal(commitRecruitPractice(s,catalog,'one',1),s);assert.throws(()=>commitRecruitPractice(s,catalog,'other',10));
 s=completeRecruitPractice(s,'one');assert.equal(completeRecruitPractice(s,'one'),s);const free=commitRecruitPractice(s,catalog,'free',1,true,()=>0);assert.equal(free.mileage,1);assert.equal(free.draws,2);
 for(const bad of ['{broken',JSON.stringify({...s,poolId:'other'}),JSON.stringify({...s,owned:{'unknown':1}})]){assert.throws(()=>parseRecruitPractice(bad,catalog));assert.ok(bad.length);}
});
