import {publicCatalogScope} from './catalog-scope';
import {unpackCatalog,type CatalogData,type PackedCatalog} from './catalog-transport';
export async function fetchCatalog(url:string,options:{signal:AbortSignal;etag?:string;timeoutMs?:number;onDelivery?:(stale:boolean)=>void}){
 const controller=new AbortController();
 const cancel=()=>controller.abort();
 if(options.signal.aborted)cancel();else options.signal.addEventListener('abort',cancel,{once:true});
 const timer=setTimeout(cancel,options.timeoutMs??12000);
 try{
  const response=await fetch(url,{cache:publicCatalogScope(url)?'default':'no-store',signal:controller.signal,headers:{Accept:'application/vnd.gagether.catalog+json',...(options.etag?{'If-None-Match':options.etag}:{})}});
  options.onDelivery?.(response.headers.get('X-Gagether-Public-Cache')==='STALE');
  if(response.status===304&&options.etag)return null;
  if(!response.ok)throw Error('Catalog response unavailable');
  const payload=await response.json() as CatalogData|PackedCatalog;
  const data='format' in payload?unpackCatalog(payload):payload;
  if(!Array.isArray(data.entries)||data.persistent===false)throw Error('Incomplete catalog response');
  return {data,payload,etag:response.headers.get('ETag')||''};
 }finally{clearTimeout(timer);options.signal.removeEventListener('abort',cancel);}
}
