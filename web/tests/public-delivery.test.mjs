import './load-typescript.mjs';
import {test}from'node:test';import assert from'node:assert/strict';
const {withPublicDeliveryContext,dirtyPublicGroup,preparePublicRead}=await import('../lib/public-delivery-context.ts');
const {deliverPublicRead,publicReadScope,primePublicRead}=await import('../lib/public-delivery.ts');
class MemoryCache{map=new Map();async match(r){return this.map.get(r.url)?.clone()}async put(r,v){this.map.set(r.url,new Response(await v.text(),{status:v.status,headers:v.headers}))}async delete(r){return this.map.delete(r.url)}}
const request=(path='/api/characters?game=gfl2',headers={})=>new Request('https://gagether.wiki'+path,{headers});
const scope=(r,cache,read,tasks=[])=>withPublicDeliveryContext(r,p=>tasks.push(p),cache,()=>deliverPublicRead(r,read));
const response=(value=1)=>Response.json({value},{headers:{ETag:'"version-'+value+'"','Cache-Control':'public,max-age=60','X-Gagether-Roster-Revision':'revision-'+value}});
test('public cache HIT skips the framework, D1 and R2; exact weak ETags return304; forced/new-owner revisions read fresh and source callbacks receive no visitor identity',async()=>{
 const cache=new MemoryCache(),tasks=[];let calls=0;
 const read=async r=>{calls++;assert.equal(r.headers.get('cookie'),null);return response(calls)};
 const first=await scope(request(undefined,{cookie:'private=session'}),cache,read,tasks);assert.equal(first.status,200);await Promise.all(tasks);assert.equal(calls,1);
 const hit=await scope(request(),cache,read);assert.equal(hit.headers.get('X-Gagether-Public-Cache'),'HIT');assert.equal(calls,1);assert.equal((await hit.json()).value,1);
 const conditional=await scope(request(undefined,{'If-None-Match':'W/"version-1"'}),cache,read);assert.equal(conditional.status,304);assert.equal(await conditional.text(),'');assert.equal(calls,1);
 const forcedTasks=[];await scope(request(undefined,{'X-Gagether-Roster-Revision':'revision-2'}),cache,read,forcedTasks);await Promise.all(forcedTasks);assert.equal(calls,2);
 const explicit=[];await scope(request(undefined,{'X-Gagether-Public-Fresh':'1'}),cache,read,explicit);await Promise.all(explicit);assert.equal(calls,3);
});
test('stale replies return immediately, one background lease coalesces readers, and revalidation replaces the snapshot',async()=>{
 const cache=new MemoryCache(),tasks=[];await scope(request(),cache,async()=>response(),tasks);await Promise.all(tasks);
 for(const v of cache.map.values())if(v.headers.has('X-Gagether-Public-Stored-At'))v.headers.set('X-Gagether-Public-Stored-At',String(Date.now()-20000));
 let release,calls=0;const read=()=>{calls++;return new Promise(resolve=>{release=()=>resolve(response(2))})},background=[];
 const old=await scope(request(),cache,read,background);assert.equal(old.headers.get('X-Gagether-Public-Cache'),'STALE');assert.equal((await old.json()).value,1);assert.equal(calls,1);
 const next=await scope(request(),cache,read,background);assert.equal(next.headers.get('X-Gagether-Public-Cache'),'STALE');assert.equal(calls,1);release();await Promise.all(background);
 const fresh=await scope(request(),cache,read);assert.equal(fresh.headers.get('X-Gagether-Public-Cache'),'HIT');assert.equal((await fresh.json()).value,2);
});
test('sessions, owner/automatic reads, writes and unknown selectors bypass public caching; errors/cookies remain uncached',async()=>{
 for(const path of ['/api/favorites?session=1','/api/characters?game=gfl2&manage=1','/api/data?view=automatic','/api/data','/api/data?view=index&owner=1','/api/characters?game=invalid','/api/wuwa/library?view=directory&id=1102'])assert.equal(publicReadScope(request(path)),null,path);
 assert.equal(publicReadScope(new Request('https://gagether.wiki/api/favorites',{method:'POST'})),null);assert.equal(publicReadScope(request('/api/favorites',{Authorization:'Bearer private'})),null);
 for(const make of [()=>Response.json({error:'down'},{status:503}),()=>Response.json({private:true},{headers:{'Set-Cookie':'private=value'}}),()=>Response.json({fallback:true},{headers:{'Cache-Control':'no-store'}})]){
  const cache=new MemoryCache(),tasks=[];let n=0;const read=async()=>{n++;return make()};await scope(request(),cache,read,tasks);await Promise.all(tasks);await scope(request(),cache,read,tasks);await Promise.all(tasks);assert.equal(n,2);
 }
});
test('writes invalidate only their public group and queued projection work completes after the mutation response is ready',async()=>{
 const cache=new MemoryCache(),first=[];await scope(request(),cache,async()=>response(),first);await Promise.all(first);
 const tasks=[];let built=false;await withPublicDeliveryContext(new Request('https://gagether.wiki/api/editor/characters',{method:'POST'}),p=>tasks.push(p),cache,async()=>{dirtyPublicGroup('roster:gfl2');preparePublicRead('roster:gfl2',async()=>{built=true;await primePublicRead(request(),response(9))});return Response.json({saved:true})});
 await Promise.all(tasks);assert.equal(built,true);const changed=await scope(request(),cache,()=>{throw Error('Prepared response should already exist')});assert.equal((await changed.json()).value,9);
});
test('an older background projection cannot overwrite a newer mutation generation',async()=>{
 const cache=new MemoryCache(),older=[],newer=[];let release;
 const mutate=(tasks,value,hold=false)=>withPublicDeliveryContext(new Request('https://gagether.wiki/api/editor/characters',{method:'POST'}),p=>tasks.push(p),cache,async()=>{dirtyPublicGroup('roster:gfl2');preparePublicRead('roster:gfl2',async()=>{if(hold)await new Promise(resolve=>{release=resolve});await primePublicRead(request(),response(value))});return Response.json({saved:true})});
 await mutate(older,1,true);await new Promise(setImmediate);await mutate(newer,2);await Promise.all(newer);release();await Promise.all(older);
 const latest=await scope(request(),cache,()=>{throw Error('New generation should be prepared')});assert.equal((await latest.json()).value,2);
});
