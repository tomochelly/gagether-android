import {env} from 'cloudflare:workers';
import {canWriteData} from '@/lib/write-access';
import {sameOrigin} from '@/lib/store';
import {matchesIfNoneMatch} from '@/lib/http-cache';
import {nteBoardMediaByHash as conveneClipByHash,nteBoardMediaKey as conveneMediaKey} from '@/lib/nte-board-media';
import {conveneByteRange} from '@/lib/wuwa-convene-media';
const CONVENE_MEDIA_MAX_BYTES=262144;
const privateHeaders={'Cache-Control':'no-store'};
type Context={params:Promise<{hash:string}>};
async function asset(context:Context){const {hash}=await context.params;return /^[a-f0-9]{64}$/.test(hash)?conveneClipByHash.get(hash):undefined;}
export async function GET(request:Request,context:Context){
 const a=await asset(context);if(!a)return new Response('Not found',{status:404});
 const etag='"'+a.sha256+'"',headers={'Content-Type':a.contentType,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes',ETag:etag,'Content-Length':String(a.bytes)};
 if(matchesIfNoneMatch(request.headers.get('If-None-Match'),etag))return new Response(null,{status:304,headers});
 const range=conveneByteRange(request.headers.has('If-Range')&&request.headers.get('If-Range')!==etag?null:request.headers.get('Range'),a.bytes);
 if(range===null)return new Response(null,{status:416,headers:{...privateHeaders,'Content-Range':'bytes */'+a.bytes}});
 try{
  const saved=request.method==='HEAD'?await env.BUCKET?.head(conveneMediaKey(a.sha256)):await env.BUCKET?.get(conveneMediaKey(a.sha256),range?{range}:undefined);
  if(saved?.size===a.bytes&&saved.customMetadata?.sha256===a.sha256){
   const out=range?{...headers,'Content-Length':String(range.length),'Content-Range':`bytes ${range.offset}-${range.offset+range.length-1}/${a.bytes}`}:headers;
   return new Response(request.method==='HEAD'?null:(saved as R2ObjectBody).body,{status:range?206:200,headers:out});
  }
 }catch{}
 return new Response('NTE media temporarily unavailable',{status:503,headers:privateHeaders});
}
export const HEAD=GET;
export async function POST(request:Request,context:Context){
 if(!sameOrigin(request)||!await canWriteData(request))return Response.json({error:'Owner or updater required'},{status:403,headers:privateHeaders});
 const a=await asset(context);if(!a)return Response.json({error:'Unknown NTE media'},{status:404,headers:privateHeaders});
 if(!env.BUCKET)return Response.json({error:'Storage unavailable'},{status:503,headers:privateHeaders});
 if(a.bytes>(a.id==='bgm'?8*1024*1024:CONVENE_MEDIA_MAX_BYTES)||Number(request.headers.get('Content-Length')||0)>a.bytes)return Response.json({error:'Clip size mismatch'},{status:413,headers:privateHeaders});
 const reader=request.body?.getReader();if(!reader)return Response.json({error:'Empty clip'},{status:400,headers:privateHeaders});
 let size=0;const chunks:Uint8Array[]=[];try{while(true){const item=await reader.read();if(item.done)break;size+=item.value.byteLength;if(size>a.bytes)return Response.json({error:'Clip size mismatch'},{status:413,headers:privateHeaders});chunks.push(item.value);}}finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 if(size!==a.bytes||hash!==a.sha256)return Response.json({error:'Clip size or SHA-256 mismatch'},{status:400,headers:privateHeaders});
 const key=conveneMediaKey(hash),old=await env.BUCKET.head(key),reused=old?.size===a.bytes&&old.customMetadata?.sha256===hash;
 if(!reused)await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:a.contentType,cacheControl:'public, max-age=31536000, immutable'},customMetadata:{sha256:hash}});
 const saved=await env.BUCKET.head(key);if(saved?.size!==a.bytes||saved.customMetadata?.sha256!==hash)return Response.json({error:'Clip readback failed'},{status:503,headers:privateHeaders});
 return Response.json({ok:true,sha256:hash,bytes:a.bytes,reused},{headers:privateHeaders});
}
