import {deliveryContext} from './public-delivery-context';
import {matchesIfNoneMatch} from './http-cache';
import {packCatalog,type CatalogData} from './catalog-transport';

// Completed public JSON only. Never retain an in-flight DB/fetch promise from
// another Worker request: its owner can disconnect and strand every waiter.
type Snapshot={key:string;etag:string;body:string};
type Storage={get:(slot:string)=>Promise<{key:string;etag:string;body:string}|null>;put:(slot:string,value:Snapshot)=>Promise<void>};
const completed=new Map<string,Snapshot>();
function rememberSnapshot(slot:string,snapshot:Snapshot){
 completed.delete(slot);if(snapshot.body.length*2<=12_000_000)completed.set(slot,snapshot);
 let bytes=0;for(const value of completed.values())bytes+=value.body.length*2;
 while(completed.size>4||bytes>12_000_000){const first=completed.keys().next().value;if(first===undefined)break;bytes-=completed.get(first)!.body.length*2;completed.delete(first);}
}
export async function publicCatalog(request:Request,options:{build:string;archive:boolean;gameId?:string;revision:()=>Promise<string>;read:()=>Promise<CatalogData>;storage?:Storage}){
 const started=Date.now(),slot=(options.archive?'archive':'current')+(options.gameId?'-game-'+options.gameId:'');
 let key:string|undefined;
 const respond=(snapshot:Snapshot,state:string)=>{
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-cache',Vary:'Accept',ETag:snapshot.etag,'Server-Timing':`catalog;dur=${Date.now()-started};desc="${state}"`};
  return matchesIfNoneMatch(request.headers.get('If-None-Match'),snapshot.etag)?new Response(null,{status:304,headers}):new Response(snapshot.body,{headers});
 };
 try{
  key=options.build+':'+await options.revision()+':'+slot;
  const etag='"catalog-'+key+'"';
  if(matchesIfNoneMatch(request.headers.get('If-None-Match'),etag))return respond({key,etag,body:''},'UNCHANGED');
  const memory=completed.get(slot);
  if(memory?.key===key)return respond(memory,'MEMORY');
  const saved=await options.storage?.get(slot);
  if(saved?.key===key){rememberSnapshot(slot,saved);return respond(saved,'SNAPSHOT');}
 }catch{/* An unavailable acceleration store must not prevent a fresh read. */}
 const data=await options.read();
 // Do not replace a last good client snapshot with seed-only/partial owner data.
 if(!data.persistent)return Response.json({error:'Catalog temporarily unavailable'},{status:503,headers:{'Cache-Control':'no-store','Retry-After':'2'}});
 const body=JSON.stringify(packCatalog(data));
 const digest=key||Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body))),n=>n.toString(16).padStart(2,'0')).join('');
 const snapshot={key:key||'',etag:'"catalog-'+digest+'"',body};
 if(key){
  try{
   if(key===options.build+':'+await options.revision()+':'+slot){
    rememberSnapshot(slot,snapshot);
    const persist=options.storage?.put(slot,snapshot);if(persist){const context=deliveryContext();if(context)context.waitUntil(persist.catch(()=>{}));else await persist;}
   }
  }catch{/* A read still succeeds if caching fails. */}
 }
 return respond(snapshot,'FRESH');
}
export function catalogObjectStorage(bucket:R2Bucket):Storage{
 const path=(slot:string)=>'runtime/public-catalog/v1/'+slot+'.json';
 return {
  async get(slot){const value=await bucket.get(path(slot));if(!value)return null;const metadata=value.customMetadata;if(!metadata?.key||!metadata?.etag){await value.body.cancel();return null;}return {key:metadata.key,etag:metadata.etag,body:await value.text()};},
  async put(slot,value){await bucket.put(path(slot),value.body,{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'},customMetadata:{key:value.key,etag:value.etag}});}
 };
}
