import {catalogAsset,catalogAssetKey,canonicalAsset} from './catalog-assets';
export async function catalogAssetResponse(request:Request,bucket:R2Bucket|undefined){
 const a=catalogAsset(new URL(request.url).pathname);if(!a)return new Response('Not found',{status:404});
 const object=await bucket?.get(catalogAssetKey(a));
 if(!object){
  // Bootstrap release keeps the canonical byte-identical file in static storage.
  const canonical=canonicalAsset(a);if(canonical.path!==a.path)return Response.redirect(new URL('/'+canonical.path,request.url),307);
  return new Response('Original asset temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'30'}});
 }
 const etag='"'+a.sha256+'"',headers={'Content-Type':a.contentType,'Content-Length':String(a.bytes),'Cache-Control':'public, max-age=86400','ETag':etag,'X-Content-Type-Options':'nosniff'};
 if(request.headers.get('if-none-match')===etag)return new Response(null,{status:304,headers});
 return new Response(request.method==='HEAD'?null:object.body,{headers});
}
