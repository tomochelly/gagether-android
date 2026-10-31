import {env} from 'cloudflare:workers';
import {canWriteData} from '@/lib/write-access';
import {sameOrigin} from '@/lib/store';
import {matchesIfNoneMatch} from '@/lib/http-cache';
import {broadcastDigest,broadcastFrameKey,broadcastFrameBindingKey,readVerifiedBroadcastRecap,validEndedRecap} from '@/lib/broadcast-analysis';
export const dynamic='force-dynamic';
const bound=8*1024*1024,privateHeaders={'Cache-Control':'no-store'};
type Context={params:Promise<{hash:string}>};
const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function pngCrc(bytes:Uint8Array,start:number,end:number){let c=0xffffffff;for(let p=start;p<end;p++)c=crcTable[(c^bytes[p])&255]^(c>>>8);return(c^0xffffffff)>>>0;}
export function inspectBroadcastFrame(bytes:Uint8Array){
 const a=(i:number)=>String.fromCharCode(...bytes.slice(i,i+4));let width=0,height=0,contentType='';
 const n32=(i:number)=>(bytes[i]*16777216+bytes[i+1]*65536+bytes[i+2]*256+bytes[i+3]);
 if(bytes.length>=45&&bytes[0]===137&&a(1)==='PNG\r'&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10&&n32(8)===13&&a(12)==='IHDR'){
  let p=8,idat=false,ended=false;while(p+12<=bytes.length){const len=n32(p),kind=a(p+4);if(len>bound||p+12+len>bytes.length||pngCrc(bytes,p+4,p+8+len)!==n32(p+8+len))throw Error('Use a real bounded PNG or JPEG video frame');if(kind==='acTL'||kind==='fcTL'||kind==='fdAT')throw Error('Use a real bounded PNG or JPEG video frame');if(kind==='IDAT'&&len>0)idat=true;if(kind==='IEND'){if(len!==0||p+12!==bytes.length)throw Error('Use a real bounded PNG or JPEG video frame');ended=true;break;}p+=len+12;}
  if(!idat||!ended||bytes[26]!==0||bytes[27]!==0||bytes[28]>1||![0,2,3,4,6].includes(bytes[25])||![1,2,4,8,16].includes(bytes[24]))throw Error('Use a real bounded PNG or JPEG video frame');width=n32(16);height=n32(20);contentType='image/png';}
 else if(bytes.length>=20&&bytes[0]===255&&bytes[1]===216&&bytes.at(-2)===255&&bytes.at(-1)===217){
  let p=2;while(p+8<bytes.length){if(bytes[p++]!==255)break;while(bytes[p]===255)p++;const marker=bytes[p++];if(marker===217)break;if(marker===218){if(width&&height)contentType='image/jpeg';break;}if(marker===216||marker===1||marker>=208&&marker<=215)continue;const length=bytes[p]*256+bytes[p+1];if(length<2||p+length>bytes.length)break;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){height=bytes[p+3]*256+bytes[p+4];width=bytes[p+5]*256+bytes[p+6];}p+=length;}
 }
 if(!contentType||!Number.isInteger(width)||!Number.isInteger(height)||width<240||height<135||width>8192||height>8192||width*height>16777216)throw Error('Use a real bounded PNG or JPEG video frame');
 return {width,height,contentType};
}
export async function GET(request:Request,context:Context){
 const {hash}=await context.params;if(!/^[a-f0-9]{64}$/.test(hash))return new Response('Not found',{status:404});
 try{const saved=await env.BUCKET?.get(broadcastFrameKey(hash)),m=saved?.customMetadata;if(!saved||!m||m.sha256!==hash||!/^recap-[a-z0-9]+-(?:ko|en|ja|zh)-[\w-]{11}$/.test(m.recapId||'')||!/^[a-f0-9]{64}$/.test(m.bodyHash||'')||!['image/png','image/jpeg'].includes(m.contentType)||saved.size<1||saved.size>bound)return new Response('Not found',{status:404});
  const headers={'Content-Type':m.contentType,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff',ETag:'"'+hash+'"'};if(matchesIfNoneMatch(request.headers.get('If-None-Match'),headers.ETag)){await saved.body?.cancel();return new Response(null,{status:304,headers});}return new Response(saved.body,{headers});
 }catch{return new Response('Frame unavailable',{status:503,headers:privateHeaders});}
}
export async function POST(request:Request,context:Context){
 if(!sameOrigin(request)||request.headers.get('sec-fetch-site')==='cross-site'||!await canWriteData(request))return Response.json({error:'Owner or updater required'},{status:403,headers:privateHeaders});
 const {hash}=await context.params,recapId=request.headers.get('X-Gagether-Broadcast-Recap')||'',bodyHash=request.headers.get('X-Gagether-Broadcast-Body-Hash')||'',rawTime=request.headers.get('X-Gagether-Broadcast-Time')||'';
 if(!/^[a-f0-9]{64}$/.test(hash)||!/^recap-[a-z0-9]+-(?:ko|en|ja|zh)-[\w-]{11}$/.test(recapId)||!/^[a-f0-9]{64}$/.test(bodyHash)||!/^\d{1,5}$/.test(rawTime))return Response.json({error:'Exact broadcast frame identity required'},{status:400,headers:privateHeaders});
 if(Number(request.headers.get('Content-Length')||0)>bound)return Response.json({error:'Frame exceeds 8MB'},{status:413,headers:privateHeaders});
 if(!env.BUCKET)return Response.json({error:'Frame storage unavailable'},{status:503,headers:privateHeaders});
 try{
  const source=await readVerifiedBroadcastRecap(recapId),seconds=Number(rawTime);if(!source||!validEndedRecap(source.row)||source.row.bodyHash!==bodyHash||seconds>(source.row.durationSeconds||43200))return Response.json({error:'Ended broadcast source or time changed'},{status:409,headers:privateHeaders});
  const reader=request.body?.getReader();if(!reader)return Response.json({error:'Empty frame'},{status:400,headers:privateHeaders});let size=0;const chunks:Uint8Array[]=[];try{while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>bound)return Response.json({error:'Frame exceeds8MB'},{status:413,headers:privateHeaders});chunks.push(p.value);}}finally{await reader.cancel().catch(()=>{});}
  const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}if(!size||await broadcastDigest(bytes)!==hash)return Response.json({error:'Frame SHA-256 mismatch'},{status:400,headers:privateHeaders});
  const image=inspectBroadcastFrame(bytes);if(request.headers.get('Content-Type')?.split(';')[0]!==image.contentType)return Response.json({error:'Frame MIME mismatch'},{status:400,headers:privateHeaders});
  const key=broadcastFrameKey(hash),previous=await env.BUCKET.head(key),m=previous?.customMetadata;
  if(previous&&(!m||m.sha256!==hash||m.contentType!==image.contentType||Number(m.width)!==image.width||Number(m.height)!==image.height))return Response.json({error:'Stored frame original metadata differs'},{status:409,headers:privateHeaders});
  if(!previous)await env.BUCKET.put(key,bytes,{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:image.contentType,cacheControl:'public, max-age=31536000, immutable'},customMetadata:{sha256:hash,recapId,bodyHash,youtubeId:source.row.youtubeId,timeSeconds:String(seconds),width:String(image.width),height:String(image.height),contentType:image.contentType}});
  const saved=await env.BUCKET.get(key);if(!saved||saved.size!==size||saved.customMetadata?.sha256!==hash||await broadcastDigest(new Uint8Array(await saved.arrayBuffer()))!==hash)return Response.json({error:'Frame readback failed'},{status:503,headers:privateHeaders});
  const bindingKey=broadcastFrameBindingKey(recapId,bodyHash,seconds,hash),existingBinding=await env.BUCKET.head(bindingKey),binding=JSON.stringify({sha256:hash,recapId,bodyHash,youtubeId:source.row.youtubeId,sourceUrl:source.row.sourceUrl,timeSeconds:seconds}),receiptHash=await broadcastDigest(new TextEncoder().encode(binding));
  if(!existingBinding)await env.BUCKET.put(bindingKey,binding,{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'},customMetadata:{sha256:hash,recapId,bodyHash,youtubeId:source.row.youtubeId,timeSeconds:String(seconds),receiptHash}});
  const storedBinding=await env.BUCKET.get(bindingKey);if(!storedBinding||storedBinding.customMetadata?.receiptHash!==receiptHash||await broadcastDigest(new Uint8Array(await storedBinding.arrayBuffer()))!==receiptHash)return Response.json({error:'Frame source binding readback failed'},{status:503,headers:privateHeaders});
  return Response.json({ok:true,hash,bytes:size,...image,url:'/api/broadcast-frames/'+hash,sourceUrl:source.row.sourceUrl,timeSeconds:seconds,reused:!!previous&&!!existingBinding},{headers:privateHeaders});
 }catch(error){return Response.json({error:error instanceof Error&&error.message.startsWith('Use a real')?error.message:'Could not store broadcast frame'},{status:error instanceof Error&&error.message.startsWith('Use a real')?400:503,headers:privateHeaders});}
}
