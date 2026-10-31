import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {createHash} from 'node:crypto';
const state={allow:false,objects:new Map(),puts:0,gets:0};globalThis.__conveneMediaEnv=state;
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return {url:'test:convene-media-env',shortCircuit:true};if(s==='@/lib/write-access')return {url:'test:convene-media-access',shortCircuit:true};if(s==='@/lib/store')return {url:'test:convene-media-origin',shortCircuit:true};return n(s,c)},load(u,c,n){if(u==='test:convene-media-env')return {format:'module',source:'export const env=globalThis.__conveneMediaEnv',shortCircuit:true};if(u==='test:convene-media-access')return {format:'module',source:'export const canWriteData=async()=>globalThis.__conveneMediaEnv.allow',shortCircuit:true};if(u==='test:convene-media-origin')return {format:'module',source:'export const sameOrigin=r=>!r.headers.get("origin")||r.headers.get("origin")===new URL(r.url).origin',shortCircuit:true};return n(u,c)}});
const {conveneByteRange,conveneClipByHash,conveneMediaKey}=await import('../lib/wuwa-convene-media.ts');
const route=await import('../app/api/wuwa/convene-media/[hash]/route.ts');
const bytes=Buffer.from('reviewed-test-convene-clip'),sha256=createHash('sha256').update(bytes).digest('hex');
const a={sha256,bytes:bytes.length,contentType:'video/mp4'};conveneClipByHash.set(sha256,a);
const url='https://gagether.wiki/api/wuwa/convene-media/'+sha256,context={params:Promise.resolve({hash:sha256})};
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
 const r=await route.GET(new Request(url),context);assert.equal(r.status,200);assert.equal(r.headers.get('Content-Type'),'video/mp4');assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes);const etag=r.headers.get('ETag'),before=state.gets;
 assert.equal((await route.GET(new Request(url,{headers:{'If-None-Match':etag}}),context)).status,304);assert.equal(state.gets,before);
 const partial=await route.GET(new Request(url,{headers:{Range:'bytes=2-5'}}),context);assert.equal(partial.status,206);assert.equal(partial.headers.get('Content-Range'),`bytes 2-5/${bytes.length}`);assert.deepEqual(Buffer.from(await partial.arrayBuffer()),bytes.subarray(2,6));
 const head=await route.HEAD(new Request(url,{method:'HEAD'}),context);assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);
 assert.equal((await route.GET(new Request(url,{headers:{Range:'bytes=999-'}}),context)).status,416);assert.equal((await route.GET(new Request(url,{headers:{Range:'bytes=2-5','If-Range':'"stale"'}}),context)).status,200);
 assert.equal((await route.GET(new Request(url),{params:Promise.resolve({hash:'../../owner'})})).status,404);
});
test('missing, corrupt or failed storage gives an uncached recoverable response',async()=>{
 state.objects.get(conveneMediaKey(sha256)).customMetadata.sha256='wrong';const r=await route.GET(new Request(url),context);assert.equal(r.status,503);assert.equal(r.headers.get('Cache-Control'),'no-store');state.BUCKET.get=async()=>{throw Error('temporary')};assert.equal((await route.GET(new Request(url),context)).status,503);
});

test('character reveals resolve only exact reviewed character identities with bounded original media',async()=>{
 const {characterConveneClips,conveneCharacterClip,conveneClipByHash}=await import('../lib/wuwa-convene-media.ts');
 assert.deepEqual(characterConveneClips.map(c=>c.characterId).sort(),['1109','1312','1509']);
 for(const c of characterConveneClips){assert.equal(conveneCharacterClip('character:'+c.characterId),c);assert.equal(conveneClipByHash.get(c.sha256),c);assert.ok(c.bytes<=24*1024*1024&&c.duration>0&&c.width<=2560);assert.equal(conveneCharacterClip('weapon:'+c.characterId),undefined);}
 assert.equal(conveneCharacterClip('character:9999'),undefined);assert.equal(conveneCharacterClip('1312'),undefined);
});


test('reviewed QHD originals retain AAC and full composition, with legacy hashes still readable',async()=>{
 const {characterConveneClips,conveneClipByHash,conveneClip}=await import('../lib/wuwa-convene-media.ts');
 for(const id of ['1109','1509']){
  const clip=characterConveneClips.find(c=>c.characterId===id);assert.equal(clip.width,2560);assert.equal(clip.height,1440);assert.equal(clip.audio,true);assert.equal(clip.fit,'screen');assert.ok(conveneClipByHash.has(clip.fallbackSha256));
 }
 const trim=characterConveneClips.find(c=>c.characterId==='1312');assert.ok(trim.duration<17.2);assert.ok(conveneClipByHash.has(trim.fallbackSha256));
 assert.equal(conveneClip(5).beamEnd,conveneClip(5).starsStart);assert.ok(conveneClip(5).beamEnd<conveneClip(5).duration);
});

test('the five standard characters use full artwork while retired captures remain readable for older clients',async()=>{
 const {conveneCharacterClip,conveneClipByHash}=await import('../lib/wuwa-convene-media.ts');
 for(const id of ['1104','1203','1301','1405','1503']){
  assert.equal(conveneCharacterClip('character:'+id),undefined);
  assert.ok([...conveneClipByHash.values()].some(c=>c.characterId===id));
 }
});
