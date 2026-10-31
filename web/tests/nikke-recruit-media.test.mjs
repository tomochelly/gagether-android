import './load-typescript.mjs';import {test} from 'node:test';import assert from 'node:assert/strict';import {registerHooks} from 'node:module';import {createHash} from 'node:crypto';
const state={allow:false,objects:new Map(),puts:0};globalThis.__nikkeMediaTest=state;
registerHooks({resolve(s,c,n){const names={'cloudflare:workers':'env','@/lib/write-access':'access','@/lib/store':'origin'};return names[s]?{url:'test:nikke-'+names[s],shortCircuit:true}:n(s,c);},load(u,c,n){const code={'test:nikke-env':'export const env=globalThis.__nikkeMediaTest','test:nikke-access':'export const canWriteData=async()=>globalThis.__nikkeMediaTest.allow','test:nikke-origin':'export const sameOrigin=r=>r.headers.get("origin")===new URL(r.url).origin'}[u];return code?{format:'module',source:code,shortCircuit:true}:n(u,c);}});
const {nikkeRecruitAssets,nikkeRecruitMediaKey}=await import('../lib/nikke-recruit-media.ts'),route=await import('../app/api/nikke/convene-media/[hash]/route.ts');
const data=Buffer.from('NIKKE reviewed test only'),hash=createHash('sha256').update(data).digest('hex'),clip={sha256:hash,bytes:data.length};nikkeRecruitAssets.push(clip);
const url='https://gagether.wiki/api/nikke/convene-media/'+hash,context={params:Promise.resolve({hash})};
state.BUCKET={head:async k=>state.objects.get(k),get:async(k,o)=>{const v=state.objects.get(k);return v&&{...v,body:o?.range?v.data.subarray(o.range.offset,o.range.offset+o.range.length):v.data};},put:async(k,b,o)=>{state.puts++;state.objects.set(k,{size:b.length,data:b,customMetadata:o.customMetadata});}};
test('media uploads require existing owner authority, same origin and exact registered bytes',async()=>{
 const req=(body=data,origin='https://gagether.wiki')=>new Request(url,{method:'POST',headers:{origin},body});
 assert.equal((await route.POST(req(),context)).status,403);state.allow=true;assert.equal((await route.POST(req(data,'https://other.test'),context)).status,403);assert.equal((await route.POST(req(Buffer.alloc(data.length)),context)).status,400);assert.equal(state.puts,0);
 assert.equal((await route.POST(req(),context)).status,200);assert.equal((await (await route.POST(req(),context)).json()).reused,true);assert.equal(state.puts,1);
});
test('playback has exact ranged bytes, HEAD, etag, unknown and corrupt-media responses',async()=>{
 const full=await route.GET(new Request(url),context);assert.equal(full.status,200);assert.deepEqual(Buffer.from(await full.arrayBuffer()),data);
 const r=await route.GET(new Request(url,{headers:{range:'bytes=2-7'}}),context);assert.equal(r.status,206);assert.deepEqual(Buffer.from(await r.arrayBuffer()),data.subarray(2,8));
 assert.equal((await route.HEAD(new Request(url,{method:'HEAD'}),context)).headers.get('content-length'),String(data.length));
 assert.equal((await route.GET(new Request(url,{headers:{'if-none-match':'"'+hash+'"'}}),context)).status,304);
 assert.equal((await route.GET(new Request(url,{headers:{range:'bytes=999-'}}),context)).status,416);assert.equal((await route.GET(new Request(url),{params:Promise.resolve({hash:'bad'})})).status,404);
 state.objects.get(nikkeRecruitMediaKey(hash)).customMetadata.sha256='bad';assert.equal((await route.GET(new Request(url),context)).status,503);
});
