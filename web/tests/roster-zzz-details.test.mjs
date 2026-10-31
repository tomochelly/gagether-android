import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';import {registerHooks} from 'node:module';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
const fullData=bootstrap.find(r=>r.gameId==='zzz'),data={...fullData,characters:fullData.characters.filter(c=>c.availability?.status!=='announced')};data.coverage={...data.coverage,includedCount:data.characters.length};
const {characterRosterSchema,rosterSummary}=await import('../lib/character-roster.ts'),{rosterSkillDescription,rosterSkillMaxLevel}=await import('../lib/character-roster-metrics.ts');
test('all current ZZZ identities keep complete official originals, native skills, exact growth assumptions and deferred summaries',()=>{
 characterRosterSchema.parse(data);assert.equal(data.characters.length,61);assert.ok(Buffer.byteLength(JSON.stringify(data))<4400000);
 for(const c of data.characters){
  assert.equal(c.image.kind,'full-body');assert.equal(c.image.sourceKind,'official');assert.equal(c.image.locale,'neutral');assert.ok(c.image.width>=1297&&c.image.height===1369);
  assert.equal(c.stats.length,9);assert.equal(c.statProgression.rows.length,12);assert.equal(c.statProgression.rows.at(-1).level,60);assert.match(c.statProgression.basis.ko,/핵심 강화 0/);
  assert.equal(c.skillTables.filter(s=>s.id.startsWith('zzz-mindscape-')).length,6);
  assert.ok(c.detailSources.some(s=>s.kind==='official'));assert.ok(c.detailSources.some(s=>s.url.startsWith('https://zzz.gg/ko/characters/')));
  for(const s of c.skillTables)for(const locale of ['ko','en','ja','zh'])for(const rank of [1,rosterSkillMaxLevel(s)]){
   assert.ok(s.name[locale]);assert.doesNotMatch(rosterSkillDescription(s,locale,rank),/\{(?:CAL:|Skill:|\d+\})|<\/?(?:color|IconMap|br)/);
  }
  assert.equal(rosterSummary(c).skillTables,undefined);assert.equal(rosterSummary(c).statProgression,undefined);
 }
 assert.equal(data.characters.reduce((n,c)=>n+c.skillTables.length,0),1412);assert.equal(data.characters.reduce((n,c)=>n+c.skillTables.reduce((n,s)=>n+s.values.length,0),0),2595);
 const anby=data.characters.find(c=>c.id==='1011'),last=anby.statProgression.rows.at(-1);
 assert.deepEqual(['hp','atk','def','impact'].map(k=>last.values[k]),['7500','583','612','118']);
});

const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+f,'utf8'));
class Query{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...args){return new Query(this.sql,args)}async first(){return db.prepare(this.sql).get(...this.args)||null}async all(){return {results:db.prepare(this.sql).all(...this.args)}}async run(){return {meta:{changes:Number(db.prepare(this.sql).run(...this.args).changes)}}}}
const objects=new Map();let fail=false;
globalThis.__zzzEnv={DB:{prepare:s=>new Query(s),async batch(rows){const out=[];for(const q of rows)out.push(await q.run());return out}},BUCKET:{async put(k,v){if(fail)throw Error('R2 unavailable');objects.set(k,v)},async get(k){const v=objects.get(k);return v?{json:async()=>JSON.parse(v)}:null}}};
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return {url:'test:zzz-env',shortCircuit:true};if(s==='@/lib/write-access')return {url:'test:zzz-auth',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:zzz-env')return {format:'module',source:'export const env=globalThis.__zzzEnv',shortCircuit:true};if(u==='test:zzz-auth')return {format:'module',source:'export const canWriteData=async()=>false',shortCircuit:true};return n(u,c)}});
test('real SQLite/R2 collection and public deferred reads retain rich ZZZ facts over stale card snapshots and failed writes',async()=>{
 const {saveCharacterRoster,readCharacterRoster}=await import('../lib/character-roster-store.ts'),route=await import('../app/api/characters/route.ts'),{CharacterFacts}=await import('../components/character-roster.tsx');
 const stale=structuredClone(data);for(const c of stale.characters){c.image=c.images.find(a=>a.url.includes('_card.webp'));delete c.statProgression;delete c.skillTables;c.sections=[];c.stats=c.stats.map(s=>s.id==='hp'?{...s,value:'603'}:s)}
 const receipt=await saveCharacterRoster(stale);assert.ok(receipt.changed);assert.equal((await readCharacterRoster('zzz')).delivery,'persistent');
 const listing=await route.GET(new Request('https://gagether.wiki/api/characters?game=zzz'));assert.equal(listing.status,200);const list=await listing.json();assert.equal(list.data.characters.length,fullData.characters.length);assert.ok(list.data.characters.filter(c=>c.availability?.status!=='announced').every(c=>c.image.kind==='full-body'&&!c.skillTables&&c.detailsDeferred));const preview=list.data.characters.find(c=>c.id==='1631');assert.equal(preview.availability.status,'announced');assert.equal(preview.stats,undefined);assert.equal(preview.skillTables,undefined);
 const detail=await route.GET(new Request('https://gagether.wiki/api/characters?game=zzz&id=1011'));assert.equal(detail.status,200);const {character}=await detail.json();assert.ok(character.skillTables.length>10);assert.equal(character.statProgression.rows.at(-1).values.hp,'7500');
 const html=renderToStaticMarkup(React.createElement(CharacterFacts,{character,locale:'ko',service:'global'}));assert.match(html,/7,?500/);assert.match(html,/돌파 단계/);assert.match(html,/전체 일러스트/);
 assert.equal((await route.GET(new Request('https://gagether.wiki/api/characters?game=zzz',{headers:{'If-None-Match':listing.headers.get('ETag')}}))).status,304);
 fail=true;await assert.rejects(saveCharacterRoster({...stale,sourceVersion:'failed-new-source'}),/R2/);fail=false;assert.equal((await readCharacterRoster('zzz')).hash,receipt.hash);
});
