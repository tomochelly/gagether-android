import {matchesIfNoneMatch} from './http-cache';
import {catalogAsset,catalogAssetKey,canonicalAsset,assetHash} from './catalog-assets';
import type {DeliveryCache} from './public-delivery-context';
type AssetCache={cache?:DeliveryCache;waitUntil?:(work:Promise<unknown>)=>void};
export async function catalogAssetResponse(request:Request,bucket:R2Bucket|undefined,staticOriginal?:()=>Promise<Response>,delivery:AssetCache={}){
 const a=catalogAsset(new URL(request.url).pathname);if(!a||!['GET','HEAD'].includes(request.method))return new Response('Not found',{status:404});
 const etag='"'+a.sha256+'"',headers={'Content-Type':a.contentType,'Content-Length':String(a.bytes),'Cache-Control':'public, max-age=86400','ETag':etag,'X-Content-Type-Options':'nosniff'};
 // A client holding these exact verified bytes needs neither R2 nor static IO.
 if(matchesIfNoneMatch(request.headers.get('if-none-match'),etag))return new Response(null,{status:304,headers});
 const key=new Request(new URL('/__gagether_asset/'+a.sha256+'/'+encodeURIComponent(a.contentType),request.url).href),cache=delivery.cache;
 const head=(response:Response,state:string)=>{const h=new Headers(response.headers);h.set('X-Gagether-Asset-Cache',state);return new Response(request.method==='HEAD'?null:response.body,{status:response.status,headers:h});};
 if(cache)try{const hit=await cache.match(key);if(hit?.status===200&&hit.headers.get('etag')===etag&&hit.headers.get('Content-Length')===String(a.bytes))return head(hit,'HIT');}catch{}
 const remember=async(response:Response,state:string)=>{
  if(cache){const put=cache.put(key,response.clone()).catch(()=>{});if(delivery.waitUntil)delivery.waitUntil(put);else await put;}
  return head(response,state);
 };
 const object=await bucket?.get(catalogAssetKey(a));
 if(object)return remember(new Response(object.body,{headers}),'R2');
 // Canonical aliases and immutable manifest checks remain unchanged. Only
 // complete, byte/SHA-verified public responses enter the named edge cache.
 const canonical=canonicalAsset(a);if(canonical.path!==a.path)return Response.redirect(new URL('/'+canonical.path,request.url),307);
 if(staticOriginal){const response=await staticOriginal();if(response.ok){const bytes=await response.arrayBuffer();if(bytes.byteLength===a.bytes&&await assetHash(bytes)===a.sha256)return remember(new Response(bytes,{headers}),'STATIC');}}
 return new Response('Original asset temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'30'}});
}
