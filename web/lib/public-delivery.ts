import {games} from './games';
import {publicCatalogScope} from './catalog-scope';
import {matchesIfNoneMatch} from './http-cache';
import {deliveryContext,type DeliveryCache} from './public-delivery-context';
declare const __PATCHWORK_BUILD__:string;
const build=()=>typeof __PATCHWORK_BUILD__==='string'?__PATCHWORK_BUILD__:'test';
type Scope={group:string;path:string;format:string;freshMs:number};
export function publicReadScope(request:Request):Scope|null{
 if(request.method!=='GET'||request.headers.has('authorization')||request.headers.has('range'))return null;
 const url=new URL(request.url),q=url.searchParams;
 if([...q.keys()].some(k=>q.getAll(k).length!==1))return null;
 if(url.pathname==='/api/favorites'&&!url.search)return {group:'counts',path:url.pathname,format:'json',freshMs:5000};
 if(url.pathname==='/api/characters'&&[...q.keys()].every(k=>['game','id'].includes(k))&&games.some(g=>g.id===q.get('game')&&g.id!=='wuwa')&&(!q.has('id')||!!q.get('id')&&q.get('id')!.length<=200)){
  const p=new URLSearchParams({game:q.get('game')!});if(q.has('id'))p.set('id',q.get('id')!);return {group:'roster:'+q.get('game'),path:url.pathname+'?'+p,format:'json',freshMs:10000};
 }
 if(url.pathname==='/api/wuwa/library'&&[...q.keys()].every(k=>['view','id'].includes(k))&&!(q.has('id')&&q.has('view'))&&(!q.has('view')||['directory','combat'].includes(q.get('view')!))&&(!q.has('id')||!!q.get('id')&&q.get('id')!.length<=200))return {group:'roster:wuwa',path:url.pathname+(url.search||''),format:'json',freshMs:10000};
 const catalog=publicCatalogScope(url.pathname+url.search);
 return catalog?{group:catalog.gameId?'catalog:'+catalog.gameId:'catalog:all',path:url.pathname+url.search,format:request.headers.get('accept')?.includes('application/vnd.gagether.catalog+json')?'compact':'json',freshMs:15000}:null;
}
function cacheRequest(path:string){return new Request(new URL(path,deliveryContext()?.origin||'https://gagether.wiki'));}
const epochKey=(group:string)=>cacheRequest('/__gagether_public_delivery/'+build()+'/epoch/'+encodeURIComponent(group));
async function epoch(cache:DeliveryCache,group:string){return await(await cache.match(epochKey(group)))?.text()||'0';}
export async function invalidatePublicGroup(group:string){const cache=deliveryContext()?.cache;if(!cache)return;const generation=crypto.randomUUID();await cache.put(epochKey(group),new Response(generation,{headers:{'Cache-Control':'public,max-age=86400'}}));deliveryContext()?.epochs.set(group,generation);}
function key(scope:Scope,generation:string){const u=new URL('/__gagether_public_delivery/'+build()+'/response',deliveryContext()?.origin||'https://gagether.wiki');u.searchParams.set('group',scope.group);u.searchParams.set('epoch',generation);u.searchParams.set('path',scope.path);u.searchParams.set('format',scope.format);return new Request(u);}
function anonymous(request:Request,scope:Scope){return new Request(new URL(scope.path,request.url),{headers:{Accept:scope.format==='compact'?'application/vnd.gagether.catalog+json':'application/json'}});}
function send(request:Request,response:Response,state:string,started:number){
 const headers=new Headers(response.headers),stored=Number(headers.get('X-Gagether-Public-Stored-At'))||Date.now();
 headers.delete('X-Gagether-Public-Stored-At');headers.delete('Age');headers.set('Cache-Control','no-store');headers.set('X-Gagether-Public-Cache',state);headers.set('X-Gagether-Public-Age',String(Math.max(0,Math.floor((Date.now()-stored)/1000))));headers.set('Server-Timing',`delivery;dur=${Date.now()-started};desc="${state}"`);
 if(state==='STALE')headers.set('Retry-After','2');
 const tag=headers.get('ETag');if(tag&&matchesIfNoneMatch(request.headers.get('If-None-Match'),tag)){void response.body?.cancel();return new Response(null,{status:304,headers});}
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
async function store(cache:DeliveryCache,target:Request,response:Response){
 if(response.status!==200||response.headers.has('Set-Cookie')||response.headers.get('Cache-Control')?.includes('no-store')||!response.headers.get('Content-Type')?.includes('application/json'))return;
 const headers=new Headers(response.headers);headers.set('Cache-Control','public,max-age=3600');headers.set('X-Gagether-Public-Stored-At',String(Date.now()));headers.delete('Vary');headers.delete('Content-Length');headers.delete('Content-Encoding');
 await cache.put(target,new Response(response.body,{headers}));
}
export async function primePublicRead(request:Request,response:Response){const context=deliveryContext(),scope=publicReadScope(request);if(context?.cache&&scope)await store(context.cache,key(scope,context.epochs.get(scope.group)||await epoch(context.cache,scope.group)),response);}
/** Public JSON only. A HIT performs no D1/R2/framework call. Private sessions,
 * source/owner reads, errors and cookie-bearing responses never enter this cache. */
export async function deliverPublicRead(request:Request,render:(request:Request)=>Promise<Response>):Promise<Response>{
 const scope=publicReadScope(request),context=deliveryContext(),started=Date.now();if(!scope)return render(request);if(!context?.cache){const response=await render(request),headers=new Headers(response.headers);headers.set('X-Gagether-Public-Cache','UNAVAILABLE');return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
 const cache=context.cache;
 try{
  const target=key(scope,await epoch(cache,scope.group)),cached=await cache.match(target),stored=Number(cached?.headers.get('X-Gagether-Public-Stored-At')),age=Date.now()-stored;
  const wanted=request.headers.get('X-Gagether-Roster-Revision');
  const force=request.headers.get('X-Gagether-Public-Fresh')==='1'||!!wanted&&cached?.headers.get('X-Gagether-Roster-Revision')!==wanted;
  if(cached&&!force&&stored&&age>=0&&age<scope.freshMs)return send(request,cached,'HIT',started);
  if(cached&&!force&&stored&&age>=0&&age<300000){
   // A short Cache API lease bounds bursts without sharing an in-flight promise.
   const lease=new Request(target.url+'&lease=1');
   if(!await cache.match(lease)){
    await cache.put(lease,new Response('refreshing',{headers:{'Cache-Control':'public,max-age=20'}}));
    context.waitUntil((async()=>{try{const response=await render(anonymous(request,scope));await store(cache,target,response);}catch(error){console.warn('Public background revalidation failed',scope.group,String(error).slice(0,200));}finally{await cache.delete(lease);}})());
   }
   return send(request,cached,'STALE',started);
  }
  if(cached)void cached.body?.cancel().catch(()=>{});
  const response=await render(anonymous(request,scope));
  if(response.status!==200)return response;
  context.waitUntil(store(cache,target,response.clone()).catch(()=>{}));
  return send(request,response,force?'FRESH':'MISS',started);
 }catch(error){console.error('Public delivery cache failed',scope.group,String(error).slice(0,240));const response=await render(request),headers=new Headers(response.headers);headers.set('X-Gagether-Public-Cache','ERROR');return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
}
