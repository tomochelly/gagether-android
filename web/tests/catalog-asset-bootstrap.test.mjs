import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {catalogAssetResponse}=await import('../lib/catalog-asset-response.ts');
const {catalogAssets}=await import('../lib/catalog-assets.ts');
const a=catalogAssets.find(a=>a.path==='assets/logos/hi3-ja.png'),bytes=readFileSync('public/'+a.path),request=new Request('https://gagether.wiki/'+a.path);
test('new original works before R2 migration only when static bootstrap bytes match its immutable manifest',async()=>{
 const bucket={get:async()=>null};
 const r=await catalogAssetResponse(request,bucket,async()=>new Response(bytes));assert.equal(r.status,200);assert.equal(r.headers.get('etag'),'"'+a.sha256+'"');assert.deepEqual(new Uint8Array(await r.arrayBuffer()),new Uint8Array(bytes));
 const head=await catalogAssetResponse(new Request(request,{method:'HEAD'}),bucket,async()=>new Response(bytes));assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);
 for(const fallback of [()=>new Response('unrelated image'),()=>new Response('<html>app shell</html>'),()=>new Response('missing',{status:404})])assert.equal((await catalogAssetResponse(request,bucket,fallback)).status,503);
 assert.equal((await catalogAssetResponse(new Request('https://gagether.wiki/assets/not-in-manifest.png'),bucket,async()=>new Response(bytes))).status,404);
});
test('completed exact originals reuse the named edge cache and conditional reads need no source IO',async()=>{
 const rows=new Map();let reads=0,staticReads=0;const delivery={cache:{match:async k=>rows.get(k.url)?.clone(),put:async(k,r)=>{rows.set(k.url,r);},delete:async()=>false}},bucket={get:async()=>{reads++;return null;}},staticOriginal=async()=>{staticReads++;return new Response(bytes)};
 assert.equal((await catalogAssetResponse(request,bucket,staticOriginal,delivery)).headers.get('X-Gagether-Asset-Cache'),'STATIC');
 const hit=await catalogAssetResponse(request,bucket,staticOriginal,delivery);assert.equal(hit.headers.get('X-Gagether-Asset-Cache'),'HIT');assert.deepEqual(new Uint8Array(await hit.arrayBuffer()),new Uint8Array(bytes));assert.equal(reads,1);assert.equal(staticReads,1);
 const head=await catalogAssetResponse(new Request(request,{method:'HEAD'}),bucket,staticOriginal,delivery);assert.equal((await head.arrayBuffer()).byteLength,0);assert.equal(reads,1);
 const unchanged=await catalogAssetResponse(new Request(request,{headers:{'If-None-Match':'W/"'+a.sha256+'"'}}),bucket,staticOriginal,delivery);assert.equal(unchanged.status,304);assert.equal(reads,1);
 const failedCache={cache:{...delivery.cache,match:async()=>{throw Error('cache offline')},put:async()=>{throw Error('cache offline')}}};assert.equal((await catalogAssetResponse(request,bucket,staticOriginal,failedCache)).status,200);
 rows.clear();assert.equal((await catalogAssetResponse(request,bucket,async()=>new Response('corrupt'),delivery)).status,503);assert.equal(rows.size,0);
});
