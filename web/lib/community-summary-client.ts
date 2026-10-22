import type {CommunitySummary} from './community';
import type {Entry} from './types';
type Value={data:CommunitySummary|null;error:boolean};
type RecordValue={entry:string;value:Value;at:number;loading:boolean;generation:number;listeners:Set<(v:Value)=>void>};
const records=new Map<string,RecordValue>(),pending=new Set<string>();let timer:ReturnType<typeof setTimeout>|undefined;
export async function communityTarget(entry:Pick<Entry,'id'|'gameId'|'region'>,member:string){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([entry.gameId,entry.region,entry.id,member])));
 return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}
function queue(target:string){const r=records.get(target);if(!r||r.loading||Date.now()-r.at<30000)return;r.loading=true;pending.add(target);if(!timer)timer=setTimeout(flush,60);}
async function flush(){
 timer=undefined;const targets=[...pending].slice(0,30);targets.forEach(t=>pending.delete(t));if(pending.size)timer=setTimeout(flush,60);
 const generations=targets.map(t=>records.get(t)!.generation),ac=new AbortController(),timeout=setTimeout(()=>ac.abort(),8000);
 try{
 const response=await fetch('/api/community/summary?'+new URLSearchParams(targets.map(t=>['target',t])),{credentials:'omit',cache:'no-store',signal:ac.signal});if(!response.ok)throw Error();
 const {summaries}=await response.json() as {summaries:Record<string,CommunitySummary>};
 targets.forEach((target,i)=>{const r=records.get(target);if(!r||r.generation!==generations[i])return;if(!summaries[target])throw Error();r.value={data:summaries[target],error:false};r.at=Date.now();});
 }catch{targets.forEach((target,i)=>{const r=records.get(target);if(r&&r.generation===generations[i]){r.value={data:r.value.data,error:true};r.at=Date.now();}});}
 finally{clearTimeout(timeout);targets.forEach((target,i)=>{const r=records.get(target);if(!r)return;r.loading=false;if(r.generation!==generations[i])queue(target);else r.listeners.forEach(fn=>fn(r.value));});}
}
export function subscribeSummary(target:string,entry:string,listener:(v:Value)=>void){
 let r=records.get(target);if(!r){r={entry,value:{data:null,error:false},at:0,loading:false,generation:0,listeners:new Set()};records.set(target,r);}
 r.listeners.add(listener);listener(r.value);queue(target);
 // Bound a long visit without evicting mounted cards or in-flight requests.
 if(records.size>256)for(const [k,v] of records){if(records.size<=256)break;if(!v.listeners.size&&!v.loading)records.delete(k);}
 return()=>{r!.listeners.delete(listener);};
}
export function refreshCommunitySummaries(){for(const [target,r] of records)if(r.listeners.size)queue(target);}
export function invalidateCommunity(entry:string){for(const [target,r] of records)if(r.entry===entry){r.at=0;r.generation++;if(r.listeners.size)queue(target);}}
