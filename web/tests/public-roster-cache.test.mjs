import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import{registerHooks}from'node:module';import{createHash}from'node:crypto';
const objects=new Map();let gets=0,puts=0,failPut=false;
globalThis.__rosterCacheEnv={BUCKET:{async get(key){gets++;const v=objects.get(key);return v?{customMetadata:v.metadata,text:async()=>v.body,body:{async cancel(){}}}:null},async put(key,body,options){puts++;if(failPut)throw Error('Cache storage unavailable');objects.set(key,{body,metadata:options.customMetadata})}}};
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return{url:'test:public-roster-cache-env',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:public-roster-cache-env')return{format:'module',source:'export const env=globalThis.__rosterCacheEnv',shortCircuit:true};return n(u,c)}});
const {publicRosterResponse}=await import('../lib/public-roster-cache.ts'),sha=s=>createHash('sha256').update(s).digest('hex'),request=etag=>new Request('https://gagether.wiki/api/characters?game=hi3',{headers:etag?{'If-None-Match':etag}:{}});
test('completed public responses skip original processing; source/owner revisions invalidate immediately and unchanged reads send no body',async()=>{
 let revision='source1-owner1',reads=0;const options={slot:'hi3:directory',directory:true,revision:async()=>revision,validate(v){assert.equal(v.gameId,'hi3')},read:async()=>{reads++;return Response.json({gameId:'hi3',original:revision},{headers:{'Cache-Control':'public'}})}};
 const first=await publicRosterResponse(request(),options);assert.equal(first.status,200);assert.equal(reads,1);assert.equal(puts,1);const tag=first.headers.get('ETag'),baseline=gets;
 const second=await publicRosterResponse(request(),options);assert.match(second.headers.get('Server-Timing'),/MEMORY/);assert.equal(reads,1);assert.equal(gets,baseline);
 const same=await publicRosterResponse(request('W/'+tag),options);assert.equal(same.status,304);assert.equal(await same.text(),'');assert.equal(gets,baseline);
 revision='source1-owner2';const edited=await publicRosterResponse(request(tag),options);assert.equal(edited.status,200);assert.notEqual(edited.headers.get('ETag'),tag);assert.equal((await edited.json()).original,revision);assert.equal(reads,2);
 revision='source2-owner2';assert.equal((await publicRosterResponse(request(),options)).status,200);assert.equal(reads,3);
});
test('a cold reader validates persisted derived bytes and identity without reading originals; corrupt or wrong-game cache rebuilds safely',async()=>{
 let reads=0;const seed=(slot,body,hash=sha(body))=>objects.set('runtime/public-roster/v1/'+sha(slot)+'.json',{body,metadata:{revision:'pinned-build-source-owner',bodyHash:hash}});
 const options=slot=>({slot,revision:async()=>'pinned-build-source-owner',validate(v){if(v.gameId!=='hi3')throw Error('Wrong game')},read:async()=>{reads++;return Response.json({gameId:'hi3',native:true})}});
 seed('cold:directory',JSON.stringify({gameId:'hi3',native:true}));const cached=await publicRosterResponse(request(),options('cold:directory'));assert.match(cached.headers.get('Server-Timing'),/SNAPSHOT/);assert.equal(reads,0);
 seed('corrupt:directory','corrupt','0'.repeat(64));assert.equal((await publicRosterResponse(request(),options('corrupt:directory'))).status,200);assert.equal(reads,1);
 seed('wrong:directory',JSON.stringify({gameId:'gfl2'}));assert.equal((await publicRosterResponse(request(),options('wrong:directory'))).status,200);assert.equal(reads,2);
});
test('unknown detail remains404 with wildcard validators, failures stay uncached, cache failure does not fail a good read, and concurrent revisions cannot tag stale data',async()=>{
 const base={slot:'missing:detail',revision:async()=>'new',validate(){},read:async()=>Response.json({error:'Missing'},{status:404})};assert.equal((await publicRosterResponse(request('*'),base)).status,404);
 const before=puts;for(let i=0;i<2;i++)assert.equal((await publicRosterResponse(request(),{...base,read:async()=>Response.json({error:'Unavailable'},{status:503,headers:{'Cache-Control':'no-store'}})})).status,503);assert.equal(puts,before);
 failPut=true;const good=await publicRosterResponse(request(),{...base,slot:'optional:cache',read:async()=>Response.json({ok:true})});assert.equal(good.status,200);failPut=false;
 let checks=0;const race=await publicRosterResponse(request(),{...base,slot:'racing:source',revision:async()=>String(++checks),read:async()=>Response.json({ok:true},{headers:{ETag:'"actual-original"'}})});assert.equal(race.headers.get('Cache-Control'),'no-store');assert.equal(race.headers.get('ETag'),'"actual-original"');
});
test('verified byte slices pin their request-start revision with one SQL check; the very next request observes a concurrent owner update',async()=>{
 let current='owner-before',checks=0;
 const options={slot:'verified:character-slice',revision:async()=>{checks++;return current},validate(v){assert.ok(v.pinned)},read:async revision=>{current='owner-after';return Response.json({pinned:revision},{headers:{'X-Gagether-Roster-Read':'character-slice'}})}};
 const first=await publicRosterResponse(request(),options);assert.equal(checks,1);assert.equal((await first.json()).pinned,'owner-before');assert.match(first.headers.get('Server-Timing'),/SLICE/);const tag=first.headers.get('ETag');
 const after=await publicRosterResponse(request(tag),options);assert.equal(after.status,200);assert.notEqual(after.headers.get('ETag'),tag);assert.equal((await after.json()).pinned,'owner-after');assert.equal(checks,2);
});
