import type {Locale} from './types';
// Completed public projections only. Never share request-owned promises or identities.
const snapshots=new Map<string,{key:string;revision:string;body:Record<string,unknown>}>();
export async function cachedMobileFeed(request:Request,options:{build:string;locale:Locale;expanded:boolean;revision:()=>Promise<string>;read:()=>Promise<Record<string,unknown>>}){
 const started=Date.now(),slot=options.locale+':'+options.expanded;
 try{
  const key=options.build+':'+await options.revision()+':'+slot;
  const headers={'Cache-Control':'private, no-store','Vary':'User-Agent','Server-Timing':`mobile;dur=${Date.now()-started}`};
  let snapshot=snapshots.get(slot);
  if(snapshot?.key!==key){const body=await options.read(),revision=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(body)))),n=>n.toString(16).padStart(2,'0')).join('');snapshot={key,revision,body};snapshots.set(slot,snapshot);while(snapshots.size>8)snapshots.delete(snapshots.keys().next().value!);}
  const {revision,body}=snapshot;
  if(new URL(request.url).searchParams.get('since')===revision)return Response.json({schemaVersion:1,webRevision:options.build,unchanged:true,revision,serverTime:new Date().toISOString()},{headers});
  return Response.json({...body,revision,serverTime:new Date().toISOString()},{headers});
 }catch{return Response.json({error:'Data temporarily unavailable'},{status:503,headers:{'Cache-Control':'no-store','Retry-After':'2'}});}
}
