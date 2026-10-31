import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';import {registerHooks} from 'node:module';
import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
const data=bootstrap.find(r=>r.gameId==='umamusume');
const {characterRosterSchema,rosterCharacterSchema}=await import('../lib/character-roster.ts'),{hydrateRosterDetails}=await import('../lib/roster-detail-catalog.ts');
test('all 271 exact outfits have full originals, actual star panels and all three service revisions with 135 exact historical identities',async()=>{
 characterRosterSchema.parse(data);assert.equal(data.characters.length,271);assert.equal(data.detailCatalog.version,3);let panels=0,growth=0;const counts={jp:0,kr:0,global:0},horses=new Set();
 for(const c of data.characters){
  assert.equal(c.image.kind,'full-body');assert.ok(c.image.width>=768&&c.image.height>=1024);const full=await hydrateRosterDetails(data,c);rosterCharacterSchema.parse(full);panels+=full.statProgression.rows.length;growth+=full.stats.filter(s=>s.group==='detail').length;horses.add(full.historicalBackground.id);
  for(const region of ['jp','kr','global']){const tables=full.regionalSkillTables[region]||[];assert.ok(tables.length<=40);if(c.regions.includes(region))counts[region]++;else assert.equal(tables.length,0);if(region==='global')assert.equal(tables.filter(t=>t.type.en?.includes('Evolved')).length,0);}
  assert.equal(full.historicalBackground.id,'uma-horse:'+c.id.slice(0,4));assert.ok(full.statProgression.rows.some(r=>r.level===c.rarity));assert.ok(full.stats.every(s=>s.icon.startsWith('https://gagether.wiki/roster-detail-icons/')));
 }
 assert.deepEqual(counts,{jp:271,kr:214,global:112});assert.equal(panels,844);assert.equal(growth,1355);assert.equal(horses.size,135);
 const special=await hydrateRosterDetails(data,data.characters.find(c=>c.id==='100101'));assert.match(special.historicalBackground.summary.ko,/17전 10승/);assert.equal(special.image.sourceKind,'official');assert.equal(data.characters.find(c=>c.id==='100102').image.sourceKind,'community');
});
const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+f,'utf8'));
class Query{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...args){return new Query(this.sql,args)}async first(){return db.prepare(this.sql).get(...this.args)||null}async all(){return {results:db.prepare(this.sql).all(...this.args)}}async run(){return {meta:{changes:Number(db.prepare(this.sql).run(...this.args).changes)}}}}
const objects=new Map();let fail=false;
globalThis.__umaEnv={DB:{prepare:s=>new Query(s),async batch(rows){const out=[];for(const q of rows)out.push(await q.run());return out}},BUCKET:{async put(k,v){if(fail)throw Error('R2 unavailable');objects.set(k,v)},async get(k){const v=objects.get(k);return v?{json:async()=>JSON.parse(v)}:null}}};
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return {url:'test:uma-env',shortCircuit:true};if(s==='@/lib/write-access')return {url:'test:uma-auth',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:uma-env')return {format:'module',source:'export const env=globalThis.__umaEnv',shortCircuit:true};if(u==='test:uma-auth')return {format:'module',source:'export const canWriteData=async()=>false',shortCircuit:true};return n(u,c)}});
test('real SQLite/R2 keeps full encoded originals, public directories omit them, exact details retain owner frames and bad source blocks cannot advance last-good',async()=>{
 const {saveCharacterRoster,readCharacterRoster}=await import('../lib/character-roster-store.ts'),route=await import('../app/api/characters/route.ts');
 const stale=structuredClone(data);delete stale.detailCatalog;for(const c of stale.characters){delete c.statProgression;c.stats=[];c.image={url:'https://example.org/portrait/'+c.id+'.png',sourceUrl:c.sourceUrl,kind:'portrait'}}
 const receipt=await saveCharacterRoster(stale);assert.ok(receipt.changed);const first=data.characters.find(c=>c.id==='100101'),original=JSON.parse(fs.readFileSync('content/character-rosters/artwork-manifest.json')).find(a=>a.gameId==='umamusume'&&a.characterId===first.id);
 db.prepare('INSERT INTO editorial(key,payload,revision,updated_at,updated_by)VALUES(?,?,?,?,?)').run('roster-art:umamusume:100101',JSON.stringify({images:[{url:original.url,gallery:{x:42,y:54,zoom:.9,fit:'contain'}}]}),1,'2026-10-25T00:00:00Z','owner');
 const listing=await route.GET(new Request('https://gagether.wiki/api/characters?game=umamusume'));assert.equal(listing.status,200);const list=await listing.json();assert.equal(list.data.detailCatalog,undefined);assert.ok(list.data.characters.every(c=>c.image.kind==='full-body'&&c.detailsDeferred&&!c.historicalBackground&&!c.regionalSkillTables));assert.ok(Buffer.byteLength(JSON.stringify(list))<1200000);
 const response=await route.GET(new Request('https://gagether.wiki/api/characters?game=umamusume&id=100101'));assert.equal(response.status,200);const {character}=await response.json();assert.ok(character.regionalSkillTables.jp.length>10);assert.match(character.historicalBackground.summary.ko,/17전 10승/);assert.equal(character.artworkFrames[0].url,original.delivery==='source-original'?original.url:original.publicUrl);assert.equal(character.artworkFrames[0].gallery.x,42);
 assert.equal((await route.GET(new Request('https://gagether.wiki/api/characters?game=umamusume',{headers:{'If-None-Match':listing.headers.get('ETag')}}))).status,304);
 const broken=structuredClone(data);broken.detailCatalog.forms['100101'].sha256='0'.repeat(64);await assert.rejects(saveCharacterRoster(broken),/hash mismatch/);assert.equal((await readCharacterRoster('umamusume')).hash,receipt.hash);
 fail=true;await assert.rejects(saveCharacterRoster({...data,sourceVersion:'failed-new-source'}),/R2/);fail=false;assert.equal((await readCharacterRoster('umamusume')).hash,receipt.hash);
});
