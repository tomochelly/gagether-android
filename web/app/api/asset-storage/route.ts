import {env} from 'cloudflare:workers';
import {canWriteData} from '@/lib/write-access';
import {sameOrigin} from '@/lib/store';
import {catalogAssets,catalogAsset,catalogAssetKey,assetHash} from '@/lib/catalog-assets';
const headers={'Cache-Control':'no-store'};
export async function GET(request:Request){
 if(!await canWriteData(request))return Response.json({error:'Authorized updater or editor required'},{status:403,headers});
 const bucket=env.BUCKET;if(!bucket)return Response.json({error:'Storage unavailable'},{status:503,headers});
 const u=new URL(request.url),offset=Number(u.searchParams.get('offset')||0);
 if(!Number.isInteger(offset)||offset<0||offset>catalogAssets.length)return Response.json({error:'Invalid offset'},{status:400,headers});
 const assets=await Promise.all(catalogAssets.slice(offset,offset+25).map(async a=>{const o=await bucket.head(catalogAssetKey(a));return {path:a.path,sha256:a.sha256,bytes:a.bytes,ready:o?.size===a.bytes&&o.customMetadata?.sha256===a.sha256};}));
 return Response.json({assets,total:catalogAssets.length,nextOffset:offset+assets.length<catalogAssets.length?offset+assets.length:null},{headers});
}
export async function POST(request:Request){
 if(!sameOrigin(request)||!await canWriteData(request))return Response.json({error:'Authorized updater or editor required'},{status:403,headers});
 const bucket=env.BUCKET;if(!bucket)return Response.json({error:'Storage unavailable'},{status:503,headers});
 const a=catalogAsset(new URL(request.url).searchParams.get('path')||'');
 if(!a)return Response.json({error:'Asset is not in the reviewed immutable manifest'},{status:400,headers});
 if(a.bytes>16*1024*1024||Number(request.headers.get('content-length')||0)>a.bytes)return Response.json({error:'Size mismatch'},{status:413,headers});
 const bytes=await request.arrayBuffer();if(bytes.byteLength!==a.bytes||await assetHash(bytes)!==a.sha256)return Response.json({error:'Original size or SHA-256 mismatch'},{status:400,headers});
 const key=catalogAssetKey(a),old=await bucket.head(key);
 if(old?.size===a.bytes&&old.customMetadata?.sha256===a.sha256)return Response.json({ok:true,path:a.path,sha256:a.sha256,reused:true},{headers});
 await bucket.put(key,bytes,{httpMetadata:{contentType:a.contentType,cacheControl:'public, max-age=86400'},customMetadata:{sha256:a.sha256,originalPath:a.path}});
 const saved=await bucket.head(key);if(saved?.size!==a.bytes||saved.customMetadata?.sha256!==a.sha256)return Response.json({error:'Storage readback failed'},{status:503,headers});
 return Response.json({ok:true,path:a.path,sha256:a.sha256},{headers});
}
