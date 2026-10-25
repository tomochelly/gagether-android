import {matchesIfNoneMatch} from '@/lib/http-cache';
import {env} from 'cloudflare:workers';
import {canWriteData} from '@/lib/write-access';
import {sameOrigin} from '@/lib/store';
import {fullArtByHash,fullArtKey,fullArtHash} from '@/lib/wuwa-reference-art';
const privateHeaders={'Cache-Control':'no-store'};
type Context={params:Promise<{hash:string}>};
async function asset(context:Context){const {hash}=await context.params;return /^[a-f0-9]{64}$/.test(hash)?fullArtByHash.get(hash):undefined;}
export async function GET(request:Request,context:Context){
 const a=await asset(context);if(!a)return new Response('Not found',{status:404});
 const headers={'Content-Type':a.contentType,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff',ETag:'"'+a.sha256+'"'};
 if(matchesIfNoneMatch(request.headers.get('If-None-Match'),headers.ETag))return new Response(null,{status:304,headers});
 try{const saved=await env.BUCKET?.get(fullArtKey(a.sha256));if(saved?.size===a.bytes&&saved.customMetadata?.sha256===a.sha256)return new Response(saved.body,{headers});}catch{/* Native immutable originals are the last-good fallback. */}
 const assets=(env as unknown as {ASSETS?:Fetcher}).ASSETS;
 if(assets){const fallback=await assets.fetch(new Request(new URL('/reference-bootstrap/'+a.sha256+'.'+a.extension,request.url)));if(fallback.ok&&fallback.headers.get('Content-Type')?.split(';')[0]===a.contentType)return new Response(fallback.body,{headers});}
 if(!assets)return new Response(null,{status:307,headers:{...privateHeaders,Location:new URL('/reference-bootstrap/'+a.sha256+'.'+a.extension,request.url).href}});
 return new Response('Original unavailable',{status:503,headers:privateHeaders});
}
export async function POST(request:Request,context:Context){
 if(!sameOrigin(request)||!await canWriteData(request))return Response.json({error:'Owner or updater required'},{status:403,headers:privateHeaders});
 const a=await asset(context);if(!a)return Response.json({error:'Unknown original'},{status:404,headers:privateHeaders});
 if(!env.BUCKET)return Response.json({error:'Storage unavailable'},{status:503,headers:privateHeaders});
 if(a.bytes>16*1024*1024||Number(request.headers.get('Content-Length')||0)>a.bytes)return Response.json({error:'Original size mismatch'},{status:413,headers:privateHeaders});
 const reader=request.body?.getReader();if(!reader)return Response.json({error:'Empty original'},{status:400,headers:privateHeaders});
 let size=0;const chunks:Uint8Array[]=[];try{while(true){const item=await reader.read();if(item.done)break;size+=item.value.byteLength;if(size>a.bytes)return Response.json({error:'Original size mismatch'},{status:413,headers:privateHeaders});chunks.push(item.value);}}finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.byteLength;}
 if(size!==a.bytes||await fullArtHash(bytes.buffer)!==a.sha256)return Response.json({error:'Original size or SHA-256 mismatch'},{status:400,headers:privateHeaders});
 const key=fullArtKey(a.sha256),previous=await env.BUCKET.head(key);const reused=previous?.size===a.bytes&&previous.customMetadata?.sha256===a.sha256;
 if(!reused)await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:a.contentType,cacheControl:'public, max-age=31536000, immutable'},customMetadata:{sha256:a.sha256}});
 const stored=await env.BUCKET.head(key);if(stored?.size!==a.bytes||stored.customMetadata?.sha256!==a.sha256)return Response.json({error:'Original readback failed'},{status:503,headers:privateHeaders});
 return Response.json({ok:true,sha256:a.sha256,bytes:a.bytes,reused},{headers:privateHeaders});
}
