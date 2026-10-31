import {isLocale,localeForVisitor} from './visitor-locale';
import {dateInZone,displayZone} from './display-time';

// Only the public landing documents are shared. API, owner, deep-link, RSC and
// action requests retain their original request/identity and uncached handling.
const FRESH_MS=60_000,MAX_AGE_MS=300_000;
type ScreenCache={match:(request:Request)=>Promise<Response|undefined>;put:(request:Request,response:Response)=>Promise<void>};
type Context={waitUntil:(promise:Promise<unknown>)=>void};
const refreshing=new Set<string>();

// Sites exposes the app's existing R2 binding, but its dispatch Workers do not
// expose the default Cache API. Keep one replaceable object per public variant:
// deployment/data revisions and dates invalidate metadata, not create new files.
// This namespace is separate from owner uploads and is never publicly routed.
export function screenObjectCache(bucket:R2Bucket):ScreenCache{
 const slot=(request:Request)=>{
  const variant=new URL(request.url).searchParams.get('variant')||'';
  if(!/^\/(?:mobile|ko|en|ja|zh)?:(?:ko|en|ja|zh):(manual|auto):(simple|full):(compact|wide):\d{4}-\d{2}-\d{2}$/.test(variant))throw new Error('Invalid public screen variant');
  return 'runtime/public-screens/v1/'+encodeURIComponent(variant.replace(/:\d{4}-\d{2}-\d{2}$/,''))+'.html';
 };
 return {
  async match(request){
   const object=await bucket.get(slot(request));
   if(!object)return undefined;
   if(object.customMetadata?.cacheKey!==request.url){await object.body.cancel();return undefined;}
   try{
    const headers=new Headers(JSON.parse(object.customMetadata.headers));
    if(!headers.get('X-Gagether-Screen-Stored-At'))throw new Error('Missing screen timestamp');
    return new Response(object.body,{headers});
   }catch{await object.body.cancel();return undefined;}
  },
  async put(request,response){
   await bucket.put(slot(request),await response.arrayBuffer(),{
    httpMetadata:{contentType:'text/html; charset=utf-8',cacheControl:'private, no-store'},
    customMetadata:{cacheKey:request.url,headers:JSON.stringify([...response.headers])}
   });
  }
 };
}

export function publicScreenVariant(request:Request,now=Date.now()){
 const url=new URL(request.url),h=request.headers;
 const pathLocale=url.pathname.slice(1);
 const explicitLocale=isLocale(pathLocale)?pathLocale:undefined;
 if(request.method!=='GET'||!explicitLocale&&!['/','/mobile'].includes(url.pathname)||url.search)return null;
 if(['rsc','next-router-state-tree','next-router-prefetch','next-action','range','x-middleware-prefetch'].some(name=>h.has(name)))return null;
 if(h.get('accept')?.includes('text/x-component'))return null;
 const cookies=new Map((h.get('cookie')||'').split(';').map(part=>{const i=part.indexOf('=');return [part.slice(0,i).trim(),part.slice(i+1).trim()];}));
 const preference=cookies.get('patchwork.locale');
 const locale=explicitLocale||localeForVisitor(h.get('x-patchwork-country')||h.get('cf-ipcountry'),h.get('accept-language'),preference);
 const manual=!!explicitLocale||isLocale(preference);
 const compact=/Android|Mobile|iPhone|iPad/i.test(h.get('user-agent')||'');
 const mobile=url.pathname==='/mobile'||compact,simple=cookies.get(mobile?'gagether.mobile-view':'gagether.desktop-view')==='simple';
 const day=dateInZone(now,displayZone(locale));
 const key=[url.pathname,locale,manual?'manual':'auto',simple?'simple':'full',compact?'compact':'wide',day].join(':');
 // Render the same public document for every visitor in this variant. No auth,
 // account cookies, connector identity or arbitrary request headers enter it.
 const headers=new Headers({accept:'text/html','accept-language':locale,'user-agent':compact?'GAGETHER Mobile':'GAGETHER Desktop'});
 headers.set('cookie',[(manual?'patchwork.locale='+locale:''),'gagether.mobile-view='+(mobile&&simple?'simple':'full'),'gagether.desktop-view='+(!mobile&&simple?'simple':'full')].filter(Boolean).join('; '));
 return {key,request:new Request(url,{headers})};
}

export async function screenContentRevision(db:D1Database){
 // Lightweight metadata catches additions, edits, hides/resets and source status
 // changes across isolates/regions, without reading content or writing a table.
 const rows=await db.prepare("SELECT 'entry:'||id AS key,updated_at AS revision FROM entries UNION ALL SELECT 'edit:'||key,CAST(revision AS TEXT)||':'||updated_at FROM editorial UNION ALL SELECT 'feed:'||game_id,checked_at||':'||status||':'||count||':'||COALESCE(error,'') FROM source_checks ORDER BY key").all<{key:string;revision:string}>();
 if(!Array.isArray(rows.results))throw new Error('Content revision unavailable');
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(rows.results)));
 return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}

function delivery(response:Response,state:string,started:number){
 const headers=new Headers(response.headers);
 // Storage is explicitly controlled inside the Worker; neither the browser nor
 // a downstream shared cache may reuse another visitor's language/layout.
 headers.set('Cache-Control','private, no-store');
 headers.set('X-Gagether-Screen-Cache',state);
 headers.append('Server-Timing',`screen;dur=${Math.max(0,Date.now()-started)};desc="${state}"`);
 headers.delete('X-Gagether-Screen-Stored-At');headers.delete('Age');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

async function remember(cache:ScreenCache,key:Request,response:Response){
 if(response.status!==200||response.headers.has('set-cookie')||!response.headers.get('content-type')?.includes('text/html'))return;
 const html=await response.text();
 // Never retain a seed/fallback page produced by a failed DB/editorial read.
 if(!html.includes('data-catalog-state="ready"')||!html.includes('</html>'))return;
 const headers=new Headers(response.headers);
 headers.set('Cache-Control',`public, max-age=${MAX_AGE_MS/1000}`);
 headers.set('X-Gagether-Screen-Stored-At',String(Date.now()));
 headers.delete('Vary');headers.delete('Content-Length');headers.delete('Content-Encoding');
 await cache.put(key,new Response(html,{headers}));
}

export async function publicScreen(request:Request,options:{build:string;cache:ScreenCache;ctx:Context;revision:()=>Promise<string>;render:(request:Request)=>Promise<Response>}){
 const started=Date.now(),variant=publicScreenVariant(request,started);
 if(!variant)return options.render(request);
 let key:Request,cached:Response|undefined,stage='revision';
 try{
  const revision=await options.revision();
  const url=new URL('/__gagether_screen_cache',request.url);
  url.searchParams.set('build',options.build);url.searchParams.set('variant',variant.key);url.searchParams.set('revision',revision);
  key=new Request(url);stage='cache-read';cached=await options.cache.match(key);
 }catch(error){
  console.warn('Public screen cache bypass',stage,error instanceof Error?error.message:String(error));
  const response=delivery(await options.render(variant.request),'BYPASS',started);response.headers.set('X-Gagether-Screen-Fallback',stage);return response;
 }
 const age=Date.now()-Number(cached?.headers.get('X-Gagether-Screen-Stored-At')||0);
 if(cached&&age>=0&&age<MAX_AGE_MS){
  if(age>FRESH_MS&&!refreshing.has(key.url)){
   refreshing.add(key.url);
   options.ctx.waitUntil(options.render(variant.request).then(response=>remember(options.cache,key,response)).catch(()=>{}).finally(()=>refreshing.delete(key.url)));
  }
  return delivery(cached,age>FRESH_MS?'STALE':'HIT',started);
 }
 // Stream cancellation can await another tee consumer; never block rendering.
 void cached?.body?.cancel().catch(()=>{});
 const response=await options.render(variant.request);
 options.ctx.waitUntil(remember(options.cache,key,response.clone()).catch(error=>{console.warn('Public screen cache write failed',error instanceof Error?error.message:String(error));}));
 return delivery(response,'MISS',started);
}
