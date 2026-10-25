import {matchesIfNoneMatch} from './http-cache';
import {catalogAsset,catalogAssetKey,canonicalAsset,assetHash} from './catalog-assets';
export async function catalogAssetResponse(request:Request,bucket:R2Bucket|undefined,staticOriginal?:()=>Promise<Response>){
 const a=catalogAsset(new URL(request.url).pathname);if(!a)return new Response('Not found',{status:404});
 const object=await bucket?.get(catalogAssetKey(a));
 if(!object){
  // Bootstrap release keeps the canonical byte-identical file in static storage.
  const canonical=canonicalAsset(a);if(canonical.path!==a.path)return Response.redirect(new URL('/'+canonical.path,request.url),307);
  // A new immutable original is packaged until its R2 receipt exists. The worker
  // intercepts /assets before Vinext, so explicitly read that bootstrap copy and
  // verify its bytes instead of returning503 for every newly introduced image.
  if(staticOriginal){const response=await staticOriginal();if(response.ok){const bytes=await response.arrayBuffer();if(bytes.byteLength===a.bytes&&await assetHash(bytes)===a.sha256)return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':a.contentType,'Content-Length':String(a.bytes),'ETag':'"'+a.sha256+'"','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});}}
  return new Response('Original asset temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'30'}});
 }
 const etag='"'+a.sha256+'"',headers={'Content-Type':a.contentType,'Content-Length':String(a.bytes),'Cache-Control':'public, max-age=86400','ETag':etag,'X-Content-Type-Options':'nosniff'};
 if(matchesIfNoneMatch(request.headers.get('if-none-match'),etag))return new Response(null,{status:304,headers});
 return new Response(request.method==='HEAD'?null:object.body,{headers});
}
