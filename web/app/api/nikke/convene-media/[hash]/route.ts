import {env} from 'cloudflare:workers';
import {canWriteData} from '@/lib/write-access';
import {sameOrigin} from '@/lib/store';
import {matchesIfNoneMatch} from '@/lib/http-cache';
import {conveneByteRange} from '@/lib/wuwa-convene-media';
import {nikkeRecruitAssets,nikkeRecruitMediaKey} from '@/lib/nikke-recruit-media';
type Context={params:Promise<{hash:string}>};
const noStore={'Cache-Control':'no-store'};
async function clip(context:Context){const {hash}=await context.params;return /^[a-f0-9]{64}$/.test(hash)?nikkeRecruitAssets.find(c=>c.sha256===hash):undefined;}
export async function GET(request:Request,context:Context){
 const a=await clip(context);if(!a)return new Response('Not found',{status:404});
 const etag='"'+a.sha256+'"',headers={'Content-Type':('contentType' in a?a.contentType:'video/mp4'),'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes',ETag:etag};
 if(matchesIfNoneMatch(request.headers.get('If-None-Match'),etag))return new Response(null,{status:304,headers});
 const range=conveneByteRange(request.headers.has('If-Range')&&request.headers.get('If-Range')!==etag?null:request.headers.get('Range'),a.bytes);
 if(range===null)return new Response(null,{status:416,headers:{...noStore,'Content-Range':'bytes */'+a.bytes}});
 try{const saved=request.method==='HEAD'?await env.BUCKET?.head(nikkeRecruitMediaKey(a.sha256)):await env.BUCKET?.get(nikkeRecruitMediaKey(a.sha256),range?{range}:undefined);
  if(saved?.size===a.bytes&&saved.customMetadata?.sha256===a.sha256)return new Response(request.method==='HEAD'?null:(saved as R2ObjectBody).body,{status:range?206:200,headers:{...headers,'Content-Length':String(range?.length||a.bytes),...(range?{'Content-Range':`bytes ${range.offset}-${range.offset+range.length-1}/${a.bytes}`}:{})}});
 }catch{}return new Response('Recruitment video unavailable',{status:503,headers:noStore});
}
export const HEAD=GET;
export async function POST(request:Request,context:Context){
 if(!sameOrigin(request)||!await canWriteData(request))return Response.json({error:'Owner or updater required'},{status:403,headers:noStore});
 const a=await clip(context);if(!a)return Response.json({error:'Unknown reviewed clip'},{status:404,headers:noStore});
 if(!env.BUCKET)return Response.json({error:'Storage unavailable'},{status:503,headers:noStore});
 if(a.bytes>24*1024*1024||Number(request.headers.get('Content-Length')||0)>a.bytes)return Response.json({error:'Clip too large'},{status:413,headers:noStore});
 const reader=request.body?.getReader();if(!reader)return Response.json({error:'Empty clip'},{status:400,headers:noStore});
 let size=0;const chunks:Uint8Array[]=[];try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>a.bytes)return Response.json({error:'Size mismatch'},{status:413,headers:noStore});chunks.push(next.value);}}finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
 if(size!==a.bytes||hash!==a.sha256)return Response.json({error:'Reviewed bytes mismatch'},{status:400,headers:noStore});
 const key=nikkeRecruitMediaKey(hash),prior=await env.BUCKET.head(key),reused=prior?.size===a.bytes&&prior.customMetadata?.sha256===hash;
 if(!reused)await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:('contentType' in a?a.contentType:'video/mp4'),cacheControl:'public, max-age=31536000, immutable'},customMetadata:{sha256:hash}});
 const saved=await env.BUCKET.head(key);if(saved?.size!==a.bytes||saved.customMetadata?.sha256!==hash)return Response.json({error:'Readback failed'},{status:503,headers:noStore});
 return Response.json({ok:true,sha256:hash,bytes:a.bytes,reused},{headers:noStore});
}
