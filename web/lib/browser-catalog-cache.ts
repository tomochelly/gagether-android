import {unpackCatalog,type CatalogData,type PackedCatalog} from './catalog-transport';
const CACHE='gagether-public-catalog-v1';
const eligible=(url:string)=>url==='/api/data?view=index'||url==='/api/data?view=index&archive=1';
export async function rememberedCatalog(url:string):Promise<{data:CatalogData;etag:string}|null>{
 try{
  if(!eligible(url)||typeof caches==='undefined')return null;
  const response=await (await caches.open(CACHE)).match(url);
  if(!response)return null;
  const time=Number(response.headers.get('X-Gagether-Saved-At'));
  if(!time||Date.now()-time>86400000)return null;
  const data=unpackCatalog(await response.json() as PackedCatalog);
  if(!data.persistent||!Array.isArray(data.entries))return null;
  return {data,etag:response.headers.get('ETag')||''};
 }catch{return null;}
}
export async function rememberCatalog(url:string,payload:PackedCatalog,etag:string){
 try{
  if(!eligible(url)||typeof caches==='undefined')return;
  await (await caches.open(CACHE)).put(url,new Response(JSON.stringify(payload),{headers:{'Content-Type':'application/json',ETag:etag,'X-Gagether-Saved-At':String(Date.now())}}));
 }catch{/* Quota/privacy restrictions must never stop public browsing. */}
}
