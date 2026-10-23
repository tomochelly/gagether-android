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
