import {env} from 'cloudflare:workers';
import type {Region} from '@/lib/types';
import {games} from '@/lib/games';
import {canWriteData} from '@/lib/write-access';
import {authHeaders,authCookie,readAuthCookie,randomToken,hashToken,sameOriginAuth} from '@/lib/google-login';
import {feedbackCategories,feedbackMaxBytes,feedbackMaxFiles,feedbackImageType,feedbackUrl,type FeedbackAttachment} from '@/lib/feedback';
import {feedbackBucket,attachmentKey,feedbackAllowed,feedbackRateKey,publicReceipt,feedbackView,type FeedbackRecord} from '@/lib/feedback-store';
export const dynamic='force-dynamic';
const cookie='__Host-gagether-feedback';
const reply=(body:unknown,status=200,extra:Record<string,string>={})=>Response.json(body,{status,headers:{...authHeaders,...extra}});
async function limitedForm(request:Request){
 const reader=request.body?.getReader();if(!reader)throw Error('Missing body');let size=0;const chunks:Uint8Array[]=[];
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>feedbackMaxBytes+65536){await reader.cancel();throw Error('Too large');}chunks.push(part.value);}
 return new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('content-type')||''},body:new Blob(chunks as BlobPart[])}).formData();
}
export async function GET(request:Request){
 if(new URL(request.url).searchParams.get('manage')==='1'){
  if(!await canWriteData(request))return reply({error:'Owner required'},403);
  try{const result=await env.DB!.prepare('SELECT * FROM feedback_requests ORDER BY created_at DESC LIMIT 100').all<FeedbackRecord>();return reply({reports:result.results.map(feedbackView)});}catch{return reply({error:'Unavailable'},503);}
 }
 const token=readAuthCookie(request.headers,cookie)||randomToken();return reply({ready:true},200,{'Set-Cookie':authCookie(cookie,token,86400)});
}
export async function POST(request:Request){
 if(!sameOriginAuth(request))return reply({error:'Origin mismatch'},403);
 const browser=readAuthCookie(request.headers,cookie);if(!browser)return reply({error:'Open the feedback form again'},403);
 if(Number(request.headers.get('content-length')||0)>feedbackMaxBytes+65536)return reply({error:'Too large'},413);
 let uploaded:string[]=[];
 try{
  const form=await limitedForm(request),field=(key:string)=>String(form.get(key)||'').trim();
  if(field('website'))return reply({ok:true,receipt:'RECEIVED'});
  const requestKey=field('requestKey'),category=field('category'),gameId=field('gameId'),region=field('region'),locale=field('locale'),message=field('message'),sourceUrl=feedbackUrl(field('sourceUrl')),replyTo=field('replyTo');
  const game=games.find(g=>g.id===gameId);
  if(!/^[0-9a-f-]{36}$/.test(requestKey)||!(feedbackCategories as readonly string[]).includes(category)||gameId&&!game||!['ko','en','ja','zh'].includes(locale)||!['kr','global','jp','cn'].includes(region)||game&&!game.regions.includes(region as Region)||message.length<5||message.length>5000||sourceUrl===null||replyTo.length>254||replyTo&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(replyTo))return reply({error:'Invalid fields'},400);
  const key=await hashToken(browser+':'+requestKey),existing=await env.DB!.prepare('SELECT id FROM feedback_requests WHERE request_key=?').bind(key).first<{id:string}>();if(existing)return reply({ok:true,receipt:publicReceipt(existing.id)});
  if(!await feedbackAllowed(await hashToken(browser),3)||!await feedbackAllowed(await feedbackRateKey(request.headers.get('cf-connecting-ip')||browser),10))return reply({error:'Please wait'},429);
  const files=form.getAll('photos').filter(x=>x instanceof File&&x.size>0) as File[];
  if(files.length>feedbackMaxFiles||files.reduce((n,f)=>n+f.size,0)>feedbackMaxBytes)return reply({error:'Invalid images'},400);
  const decoded=await Promise.all(files.map(async file=>{const bytes=new Uint8Array(await file.arrayBuffer()),type=feedbackImageType(bytes);if(!type)throw Error('Invalid image');return {file,bytes,type};}));
  const id=crypto.randomUUID(),attachments:FeedbackAttachment[]=[];
  for(const {file,bytes,type} of decoded){const fileId=crypto.randomUUID(),name=file.name.replace(/[\x00-\x1f<>"/\\]/g,'_').slice(0,150)||'image';const object=attachmentKey(id,fileId);await feedbackBucket().put(object,bytes,{httpMetadata:{contentType:type,cacheControl:'private, no-store'}});uploaded.push(object);attachments.push({id:fileId,name,type,size:bytes.length});}
  const now=Date.now();const result=await env.DB!.prepare('INSERT INTO feedback_requests(id,request_key,category,game_id,region,locale,message,source_url,reply_to,page_url,attachments,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING').bind(id,key,category,gameId||null,region,locale,message,sourceUrl,replyTo,'https://gagether.wiki/',JSON.stringify(attachments),now,now).run();
  if(result.meta.changes!==1){await Promise.all(uploaded.map(k=>feedbackBucket().delete(k)));uploaded=[];const previous=await env.DB!.prepare('SELECT id FROM feedback_requests WHERE request_key=?').bind(key).first<{id:string}>();if(!previous)throw Error('Write failed');return reply({ok:true,receipt:publicReceipt(previous.id)});}
  return reply({ok:true,receipt:publicReceipt(id),delivery:'queued'});
 }catch(error){await Promise.allSettled(uploaded.map(k=>feedbackBucket().delete(k)));const message=error instanceof Error?error.message:'';return reply({error:message==='Invalid image'?'Invalid images':message==='Too large'?'Too large':'Could not receive feedback'},message==='Invalid image'?400:message==='Too large'?413:503);}
}
