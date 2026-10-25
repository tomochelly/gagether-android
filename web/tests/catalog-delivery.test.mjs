import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {publicCatalog}=await import('../lib/public-catalog-cache.ts');
const {fetchCatalog}=await import('../lib/fetch-catalog.ts');
const {rememberedCatalog,rememberCatalog}=await import('../lib/browser-catalog-cache.ts');
const {packCatalog,unpackCatalog}=await import('../lib/catalog-transport.ts');
const sample={entries:[{id:'exact',title:{ko:'검수',en:'Reviewed',ja:'確認済み',zh:'已核实'},image:'/original.png',imageWidth:3840}],settings:{brand:{name:'Owner name'}},settingsRevision:2,sourceChecks:[],persistent:true,serverTime:new Date().toISOString()};
const request=(etag)=>new Request('https://gagether.wiki/api/data?view=index',{headers:etag?{'If-None-Match':etag}:{}});

test('completed public snapshots avoid repeated catalog reads and revalidate owner changes',async()=>{
 let revision='revision-a',reads=0;const snapshots=new Map();
 const options={build:'delivery-test',archive:false,revision:async()=>revision,read:async()=>{reads++;return structuredClone(sample)},storage:{get:async key=>snapshots.get(key),put:async(key,value)=>snapshots.set(key,value)}};
 const first=await publicCatalog(request(),options),etag=first.headers.get('etag');
 assert.deepEqual(unpackCatalog(await first.json()),sample);
 const hit=await publicCatalog(request(),options);assert.match(hit.headers.get('server-timing'),/MEMORY/);assert.equal(reads,1);
 const unchanged=await publicCatalog(request(etag),options);assert.equal(unchanged.status,304);assert.equal(reads,1);
 for(const value of ['W/'+etag,'"other", W/'+etag]){const weak=await publicCatalog(request(value),options);assert.equal(weak.status,304);assert.equal(await weak.text(),'');assert.equal(reads,1);}
 revision='revision-b';sample.settings.brand.name='Changed owner name';
 const changed=await publicCatalog(request(etag),options);assert.equal(changed.status,200);assert.equal(reads,2);assert.equal(unpackCatalog(await changed.json()).settings.brand.name,'Changed owner name');
 // A persisted snapshot from a different isolate can answer without loading D1 rows.
 const stored={...snapshots.get('current'),key:'delivery-test:remote:current',etag:'"catalog-delivery-test:remote:current"'};revision='remote';snapshots.set('current',stored);
 assert.match((await publicCatalog(request(),options)).headers.get('server-timing'),/SNAPSHOT/);assert.equal(reads,2);
 revision='failed';options.read=async()=>({...sample,persistent:false});
 assert.equal((await publicCatalog(request(),options)).status,503);assert.equal(snapshots.get('current').key,stored.key);
});

test('a hung request cannot strand another visitor; revision races are not cached',async()=>{
 let release,reads=0;const firstRead=new Promise(resolve=>release=resolve);let rev='a';const puts=[];
 const options={build:'isolated-test',archive:true,revision:async()=>rev,read:async()=>++reads===1?firstRead:structuredClone(sample),storage:{get:async()=>null,put:async(...args)=>puts.push(args)}};
 const first=publicCatalog(request(),options);
 await new Promise(resolve=>setTimeout(resolve,5));
 const second=await Promise.race([publicCatalog(request(),options),new Promise((_,reject)=>setTimeout(()=>reject(Error('Second visitor was blocked')),100))]);
 assert.equal(second.status,200);assert.equal(reads,2);
 rev='b';release(sample);await first;assert.equal(puts.length,1);
});

test('browser public cache is bounded, excludes editor data, and tolerates unavailable storage',async()=>{
 const old=globalThis.caches;const records=new Map();
 globalThis.caches={open:async()=>({put:async(key,response)=>records.set(key,response),match:async key=>records.get(key)?.clone()})};
 try{
  const url='/api/data?view=index';await rememberCatalog(url,packCatalog(sample),'"v1"');
  assert.deepEqual((await rememberedCatalog(url)).data,sample);
  await rememberCatalog('/api/data',packCatalog(sample),'private');assert.equal(records.size,1);assert.equal(await rememberedCatalog('/api/data'),null);
  const stored=records.get(url);records.set(url,new Response(await stored.text(),{headers:{'X-Gagether-Saved-At':String(Date.now()-86400001)}}));assert.equal(await rememberedCatalog(url),null);
  globalThis.caches={open:async()=>{throw Error('Storage denied')}};assert.equal(await rememberedCatalog(url),null);await rememberCatalog(url,packCatalog(sample),'v2');
 }finally{globalThis.caches=old}
});

test('stalled network requests time out, can retry, and never accept partial fallback data',async()=>{
 const old=globalThis.fetch;let canceled=false;
 try{
  globalThis.fetch=async(_,options)=>new Promise((_,reject)=>options.signal.addEventListener('abort',()=>{canceled=true;reject(Error('Aborted'))}));
  await assert.rejects(fetchCatalog('/api/data?view=index',{signal:new AbortController().signal,timeoutMs:10}));assert.equal(canceled,true);
  globalThis.fetch=async()=>Response.json(packCatalog(sample));assert.deepEqual((await fetchCatalog('/api/data?view=index',{signal:new AbortController().signal})).data,sample);
  globalThis.fetch=async()=>Response.json({...sample,persistent:false});await assert.rejects(fetchCatalog('/api/data?view=index',{signal:new AbortController().signal}));
 }finally{globalThis.fetch=old}
});
