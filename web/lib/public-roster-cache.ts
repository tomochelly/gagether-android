import {deliveryContext} from './public-delivery-context';
import {env} from 'cloudflare:workers';
import {matchesIfNoneMatch} from './http-cache';

type Snapshot={key:string;body:string};
const completed=new Map<string,Snapshot>();
const digest=async(text:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join('');
function remember(slot:string,value:Snapshot){
 completed.delete(slot);if(value.body.length*2<=6_000_000)completed.set(slot,value);
 let bytes=[...completed.values()].reduce((n,v)=>n+v.body.length*2,0);
 while(completed.size>24||bytes>6_000_000){const first=completed.keys().next().value!;bytes-=completed.get(first)!.body.length*2;completed.delete(first);}
}
/** Derived public responses only. A fresh persistent revision is checked on every
 * request; full collection originals, owner writes and validation stay separate.
 * Never retain another Worker's in-flight request or database promise. */
export async function publicRosterResponse(request:Request,options:{slot:string;revision:()=>Promise<string|null>;read:(revision:string|null)=>Promise<Response>;validate:(value:any)=>void;directory?:boolean}){
 const start=Date.now(),revision=await options.revision(),slot=options.slot,path='runtime/public-roster/v1/'+await digest(slot)+'.json';
 const etag=revision&&'"roster-read-'+revision+'-'+await digest(slot)+'"';
 const respond=(body:string,state:string)=>{
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=60, stale-while-revalidate=300',ETag:etag!,'X-Gagether-Roster-Revision':revision!,'Server-Timing':`roster;dur=${Date.now()-start};desc="${state}"`};
  return matchesIfNoneMatch(request.headers.get('If-None-Match'),etag!)?new Response(null,{status:304,headers}):new Response(body,{headers});
 };
 if(revision){
  if(options.directory&&matchesIfNoneMatch(request.headers.get('If-None-Match'),etag!))return respond('','UNCHANGED');
  const memory=completed.get(slot);if(memory?.key===revision)return respond(memory.body,'MEMORY');
  try{
   const saved=await env.BUCKET?.get(path);
   if(saved){
    if(saved.customMetadata?.revision===revision&&saved.customMetadata?.bodyHash){
     const body=await saved.text();if(body.length<=3_000_000&&await digest(body)===saved.customMetadata.bodyHash){options.validate(JSON.parse(body));remember(slot,{key:revision,body});return respond(body,'SNAPSHOT');}
    }else await saved.body?.cancel();
   }
  }catch{/* A missing, corrupt or unavailable acceleration object is not source data. */}
 }
 const fresh=await options.read(revision);
 if(!revision||fresh.status!==200||fresh.headers.get('Cache-Control')?.includes('no-store'))return fresh;
 const body=await fresh.text();
 // A checked byte slice already pins the exact request-start revision, just
 // like a cached response. Fresh source reads need a second revision check.
 // Never tag a fresh original with an earlier source or owner revision. A subsequent request will rebuild from the winning revision.
 if(body.length>3_000_000||fresh.headers.get('X-Gagether-Roster-Read')!=='character-slice'&&await options.revision()!==revision)return new Response(body,{status:200,headers:{...Object.fromEntries(fresh.headers),'Cache-Control':'no-store'}});
 options.validate(JSON.parse(body));remember(slot,{key:revision,body});
 const persist=async()=>{try{await env.BUCKET?.put(path,body,{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'},customMetadata:{revision,bodyHash:await digest(body)}});}catch{/* Completed reads remain usable without the optional cache. */}};
 const context=deliveryContext();if(context)context.waitUntil(persist());else await persist();
 return respond(body,fresh.headers.get('X-Gagether-Roster-Read')==='character-slice'?'SLICE':'FRESH');
}
