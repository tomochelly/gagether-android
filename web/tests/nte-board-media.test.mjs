import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {createHash} from 'node:crypto';
const state={allow:false,objects:new Map(),puts:0,gets:0};globalThis.__conveneMediaEnv=state;
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return {url:'test:convene-media-env',shortCircuit:true};if(s==='@/lib/write-access')return {url:'test:convene-media-access',shortCircuit:true};if(s==='@/lib/store')return {url:'test:convene-media-origin',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:convene-media-env')return {format:'module',source:'export const env=globalThis.__conveneMediaEnv',shortCircuit:true};if(u==='test:convene-media-access')return {format:'module',source:'export const canWriteData=async()=>globalThis.__conveneMediaEnv.allow',shortCircuit:true};if(u==='test:convene-media-origin')return {format:'module',source:'export const sameOrigin=r=>!r.headers.get("origin")||r.headers.get("origin")===new URL(r.url).origin',shortCircuit:true};return n(u,c)}});
const {conveneByteRange}=await import('../lib/wuwa-convene-media.ts');
const {nteBoardMediaByHash:conveneClipByHash,nteBoardMediaKey:conveneMediaKey}=await import('../lib/nte-board-media.ts');
const route=await import('../app/api/nte/board-media/[hash]/route.ts');
const bytes=Buffer.from('reviewed-test-convene-clip'),sha256=createHash('sha256').update(bytes).digest('hex');
const a={sha256,bytes:bytes.length,contentType:'audio/mp4'};conveneClipByHash.set(sha256,a);
const url='https://gagether.wiki/api/nte/board-media/'+sha256,context={params:Promise.resolve({hash:sha256})};
state.BUCKET={head:async key=>state.objects.get(key),get:async(key,options)=>{state.gets++;const value=state.objects.get(key);if(!value)return undefined;const range=options?.range;return {...value,body:range?value.bytes.subarray(range.offset,range.offset+range.length):value.bytes};},put:async(key,data,options)=>{state.puts++;state.objects.set(key,{size:data.byteLength,bytes:data,customMetadata:options.customMetadata});}};
test('single video byte ranges are bounded; malformed and multiple ranges are rejected',()=>{
 assert.deepEqual(conveneByteRange('bytes=2-5',10),{offset:2,length:4});assert.deepEqual(conveneByteRange('bytes=7-',10),{offset:7,length:3});assert.deepEqual(conveneByteRange('bytes=-3',10),{offset:7,length:3});assert.deepEqual(conveneByteRange('bytes=0-100',10),{offset:0,length:10});
 for(const v of ['bytes=','bytes=-0','bytes=11-','bytes=3-2','bytes=1-2,4-5','bytes=999999999999999999999-'])assert.equal(conveneByteRange(v,10),null);
});
test('only authenticated same-origin exact reviewed clips are stored, with idempotent metadata readback',async()=>{
 const req=(data=bytes,origin='https://gagether.wiki')=>new Request(url,{method:'POST',headers:{Origin:origin},body:data});
 assert.equal((await route.POST(req(),context)).status,403);state.allow=true;assert.equal((await route.POST(req(bytes,'https://evil.example'),context)).status,403);assert.equal((await route.POST(req(Buffer.alloc(bytes.length)),context)).status,400);assert.equal(state.puts,0);
 assert.equal((await route.POST(req(),context)).status,200);assert.equal((await (await route.POST(req(),context)).json()).reused,true);assert.equal(state.puts,1);assert.ok(state.objects.has(conveneMediaKey(sha256)));
});
test('public playback serves exact full and partial bytes, HEAD and conditional requests without arbitrary sources',async()=>{
 const r=await route.GET(new Request(url),context);assert.equal(r.status,200);assert.equal(r.headers.get('Content-Type'),'audio/mp4');assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes);const etag=r.headers.get('ETag'),before=state.gets;
 assert.equal((await route.GET(new Request(url,{headers:{'If-None-Match':etag}}),context)).status,304);assert.equal(state.gets,before);
 const partial=await route.GET(new Request(url,{headers:{Range:'bytes=2-5'}}),context);assert.equal(partial.status,206);assert.equal(partial.headers.get('Content-Range'),`bytes 2-5/${bytes.length}`);assert.deepEqual(Buffer.from(await partial.arrayBuffer()),bytes.subarray(2,6));
 const head=await route.HEAD(new Request(url,{method:'HEAD'}),context);assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);
 assert.equal((await route.GET(new Request(url,{headers:{Range:'bytes=999-'}}),context)).status,416);assert.equal((await route.GET(new Request(url,{headers:{Range:'bytes=2-5','If-Range':'"stale"'}}),context)).status,200);
 assert.equal((await route.GET(new Request(url),{params:Promise.resolve({hash:'../../owner'})})).status,404);
});
test('only the reviewed BGM may exceed the small-asset bound; MPEG range bytes remain exact',async()=>{
 const {readFileSync}=await import('node:fs'),{nteBoardBgm}=await import('../lib/nte-board-bgm.ts');
 const music=readFileSync(new URL('../ops/research/nte-bgm-20261029/nte-gacha-bgm-original.mp3',import.meta.url));
 assert.equal(music.length,nteBoardBgm.bytes);assert.equal(createHash('sha256').update(music).digest('hex'),nteBoardBgm.sha256);
 const ctx={params:Promise.resolve({hash:nteBoardBgm.sha256})},u='https://gagether.wiki/api/nte/board-media/'+nteBoardBgm.sha256;
 state.allow=true;assert.equal((await route.POST(new Request(u,{method:'POST',headers:{Origin:'https://gagether.wiki'},body:music}),ctx)).status,200);
 assert.ok(state.objects.has('nte-board-bgm/'+nteBoardBgm.sha256+'.mp3'));
 const range=await route.GET(new Request(u,{headers:{Range:'bytes=500-66035'}}),ctx);assert.equal(range.status,206);assert.equal(range.headers.get('Content-Type'),'audio/mpeg');assert.deepEqual(Buffer.from(await range.arrayBuffer()),music.subarray(500,66036));
 const large=Buffer.alloc(262145),hash=createHash('sha256').update(large).digest('hex');conveneClipByHash.set(hash,{id:'dice',sha256:hash,bytes:large.length,contentType:'audio/mp4'});
 try{assert.equal((await route.POST(new Request('https://gagether.wiki/api/nte/board-media/'+hash,{method:'POST',body:large}),{params:Promise.resolve({hash})})).status,413);}finally{conveneClipByHash.delete(hash);}
});

test('missing, corrupt or failed storage gives an uncached recoverable response',async()=>{
 state.objects.get(conveneMediaKey(sha256)).customMetadata.sha256='wrong';const r=await route.GET(new Request(url),context);assert.equal(r.status,503);assert.equal(r.headers.get('Cache-Control'),'no-store');state.BUCKET.get=async()=>{throw Error('temporary')};assert.equal((await route.GET(new Request(url),context)).status,503);
});

