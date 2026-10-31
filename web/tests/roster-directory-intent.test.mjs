import './load-typescript.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';
const {prefetchRosterDirectory,requestRosterDirectory}=await import('../lib/roster-directory-request.ts');
test('intent and click share one public directory read, while forced and conditional reads reach the server',async()=>{
 const old=globalThis.fetch,requests=[];let resolve;
 globalThis.fetch=(url,options)=>{requests.push({url,options});return new Promise(r=>resolve=()=>r(Response.json({game:'zzz'},{headers:{ETag:'"reviewed"'}})));};
 try{
  const warm=prefetchRosterDirectory('zzz'),again=prefetchRosterDirectory('zzz'),click=requestRosterDirectory('zzz');
  assert.equal(requests.length,1);assert.equal(requests[0].options.credentials,'omit');resolve();await warm;await again;assert.deepEqual(await (await click).json(),{game:'zzz'});
  const next=requestRosterDirectory('zzz',{headers:{'If-None-Match':'"reviewed"'}});assert.equal(requests.length,2);resolve();await next;
  const warmed=prefetchRosterDirectory('zzz');resolve();await warmed;
  const fresh=requestRosterDirectory('zzz',{headers:{'X-Gagether-Public-Fresh':'1'}});assert.equal(requests.length,4);resolve();await fresh;
 }finally{globalThis.fetch=old;}
});
test('a rejected warm read leaves the normal click retry available and game caches stay isolated',async()=>{
 const old=globalThis.fetch;let reads=0;
 globalThis.fetch=async url=>{reads++;if(reads===1)return new Response('',{status:503});return Response.json({url});};
 try{await assert.rejects(prefetchRosterDirectory('limbus'));assert.match((await(await requestRosterDirectory('limbus')).json()).url,/game=limbus/);await prefetchRosterDirectory('hsr');const other=await requestRosterDirectory('gfl2');assert.match((await other.json()).url,/game=gfl2/);assert.equal(reads,4);}finally{globalThis.fetch=old;}
});
