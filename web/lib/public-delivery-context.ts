import {AsyncLocalStorage} from 'node:async_hooks';
export type DeliveryCache={match:(request:Request)=>Promise<Response|undefined>;put:(request:Request,response:Response)=>Promise<void>;delete:(request:Request)=>Promise<boolean>};
type State={origin:string;waitUntil:(task:Promise<unknown>)=>void;cache?:DeliveryCache;epochs:Map<string,string>;dirty:Set<string>;jobs:Map<string,()=>Promise<unknown>>;finished:boolean};
const contexts=new AsyncLocalStorage<State>();
export function deliveryContext(){return contexts.getStore();}
export function dirtyPublicGroup(group:string){contexts.getStore()?.dirty.add(group);}
export function preparePublicRead(name:string,work:()=>Promise<unknown>){const state=contexts.getStore();if(!state)return;if(state.finished){if(!state.jobs.has(name)){state.jobs.set(name,work);state.waitUntil(work().catch(error=>console.warn('Late public preparation failed',name,String(error).slice(0,200))));}}else state.jobs.set(name,work);}
/** Factories start after the response is ready. No request ever waits for, or
 * shares, another request's database/fetch promise. */
export async function withPublicDeliveryContext(request:Request,waitUntil:State['waitUntil'],cache:DeliveryCache|undefined,render:()=>Promise<Response>){
 const state:State={origin:new URL(request.url).origin,waitUntil,cache,epochs:new Map(),dirty:new Set(),jobs:new Map(),finished:false};
 return contexts.run(state,async()=>{
  const response=await render();
  const {invalidatePublicGroup}=await import('./public-delivery');
  if(state.dirty.size){const results=await Promise.allSettled([...state.dirty].map(group=>invalidatePublicGroup(group)));for(const result of results)if(result.status==='rejected')console.warn('Public invalidation failed',String(result.reason).slice(0,200));}
  const queued=[...state.jobs.entries()];state.finished=true;
  if(queued.length)waitUntil((async()=>{
   // Bounded source work; preserve response completion and Worker memory.
   const jobs=queued;for(let i=0;i<jobs.length;i+=2){const batch=jobs.slice(i,i+2),results=await Promise.allSettled(batch.map(([,run])=>run()));results.forEach((result,j)=>{if(result.status==='rejected')console.warn('Public projection preparation failed',batch[j][0],String(result.reason).slice(0,300));});}
  })().catch(error=>console.warn('Public read preparation failed',String(error).slice(0,300))));
  return response;
 });
}
