import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';import {registerHooks} from 'node:module';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
const data=bootstrap.find(r=>r.gameId==='hsr');
const {characterRosterSchema,rosterSummary}=await import('../lib/character-roster.ts'),{progressionRows}=await import('../lib/roster-progression.ts'),{rosterSkillDescription,rosterSkillMaxLevel}=await import('../lib/character-roster-metrics.ts');
test('all 98 Star Rail forms retain complete native skills, Traces, Eidolons and all exact promotion levels',()=>{
 characterRosterSchema.parse(data);assert.equal(data.characters.length,98);assert.ok(Buffer.byteLength(JSON.stringify(data))<4400000);
 for(const c of data.characters){
  assert.ok(c.stats.length>=7);assert.equal(c.statProgression.rows.length,14);assert.equal(progressionRows(c.statProgression).length,86);assert.match(c.statProgression.basis.ko,/광추.*성혼 제외/);
  assert.equal(c.skillTables.filter(s=>s.id.startsWith('eidolon:')).length,6);assert.ok(c.skillTables.length<=40);
  for(const s of c.skillTables)for(const locale of ['ko','en','ja','zh'])for(const level of [1,rosterSkillMaxLevel(s)]){
   assert.ok(s.name[locale]);assert.doesNotMatch(rosterSkillDescription(s,locale,level),/\{\d+\}|#\d+\[(?:i|f\d+)\]|<\/?(?:color|br)>/);
  }
  assert.equal(rosterSummary(c).skillTables,undefined);assert.equal(rosterSummary(c).statProgression,undefined);
 }
 assert.equal(data.characters.reduce((n,c)=>n+c.skillTables.filter(s=>s.id.startsWith('skill:')).length,0),782);
 assert.equal(data.characters.reduce((n,c)=>n+c.skillTables.filter(s=>s.id.startsWith('trace:')).length,0),326);
 assert.equal(data.characters.reduce((n,c)=>n+(c.skillTables.find(s=>s.id==='minor-traces')?.values.length||0),0),1080);
 const himeko=data.characters.find(c=>c.id==='1003'),last=progressionRows(himeko.statProgression,6).at(-1);
 assert.deepEqual(['hp','atk','def','spd'].map(k=>last.values[k]),['1047','756','436','96']);
 assert.match(rosterSkillDescription(himeko.skillTables.find(s=>s.id==='skill:100304'),'en',7),/113\.75%/);
 const march=data.characters.find(c=>c.id==='1001'),shield=march.skillTables.find(s=>s.id==='skill:100102');assert.equal(shield.baseMaxLevel,10);assert.equal(shield.maxLevel,12);assert.match(rosterSkillDescription(shield,'ko',2),/40\.37%/);
});

const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+f,'utf8'));
class Query{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...args){return new Query(this.sql,args)}async first(){return db.prepare(this.sql).get(...this.args)||null}async all(){return {results:db.prepare(this.sql).all(...this.args)}}async run(){return {meta:{changes:Number(db.prepare(this.sql).run(...this.args).changes)}}}}
const objects=new Map();let fail=false;
globalThis.__hsrEnv={DB:{prepare:s=>new Query(s),async batch(rows){const out=[];for(const q of rows)out.push(await q.run());return out}},BUCKET:{async put(k,v){if(fail)throw Error('R2 unavailable');objects.set(k,v)},async get(k){const v=objects.get(k);return v?{json:async()=>JSON.parse(v)}:null}}};
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return {url:'test:hsr-env',shortCircuit:true};if(s==='@/lib/write-access')return {url:'test:hsr-auth',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:hsr-env')return {format:'module',source:'export const env=globalThis.__hsrEnv',shortCircuit:true};if(u==='test:hsr-auth')return {format:'module',source:'export const canWriteData=async()=>false',shortCircuit:true};return n(u,c)}});
test('persistent HSR summaries stay light and deferred details recover the full native facts with pinned icons over sparse saved data',async()=>{
 const {saveCharacterRoster,readCharacterRoster}=await import('../lib/character-roster-store.ts'),route=await import('../app/api/characters/route.ts'),{CharacterFacts}=await import('../components/character-roster.tsx');
 const stale=structuredClone(data);for(const c of stale.characters){delete c.statProgression;delete c.skillTables;c.stats=c.stats.map(({icon,...s})=>({...s,value:s.id==='hp'?'144':s.value}));}
 const receipt=await saveCharacterRoster(stale);assert.ok(receipt.changed);assert.equal((await readCharacterRoster('hsr')).delivery,'persistent');
 const listing=await route.GET(new Request('https://gagether.wiki/api/characters?game=hsr'));assert.equal(listing.status,200);const list=await listing.json();assert.equal(list.data.characters.length,98);assert.ok(list.data.characters.every(c=>!c.skillTables&&!c.statProgression&&c.detailsDeferred));
 const detail=await route.GET(new Request('https://gagether.wiki/api/characters?game=hsr&id=1001'));assert.equal(detail.status,200);const {character}=await detail.json();assert.ok(character.skillTables.length>10);assert.equal(progressionRows(character.statProgression,6).at(-1).values.hp,'1058');
 assert.ok(character.skillTables.every(s=>!s.icon||s.icon.startsWith('https://gagether.wiki/roster-detail-icons/')));
 const html=renderToStaticMarkup(React.createElement(CharacterFacts,{character,locale:'ko',service:'global'}));assert.match(html,/1058/);assert.match(html,/성혼 6/);assert.match(html,/roster-native-icon/);
 assert.equal((await route.GET(new Request('https://gagether.wiki/api/characters?game=hsr',{headers:{'If-None-Match':listing.headers.get('ETag')}}))).status,304);
 fail=true;await assert.rejects(saveCharacterRoster({...stale,sourceVersion:'failed-new-source'}),/R2/);fail=false;assert.equal((await readCharacterRoster('hsr')).hash,receipt.hash);
});
