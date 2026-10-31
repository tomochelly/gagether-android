import {env} from 'cloudflare:workers';
import {editorIdentity} from '@/lib/editor-access';
import {validPushDraft,pushAudience} from '@/lib/owner-push';
import {sendFcm,fcmReadiness,FcmError,type PushEnvironment} from '@/lib/fcm-server';
export const dynamic='force-dynamic';
const reply=(b:unknown,status=200)=>Response.json(b,{status,headers:{'Cache-Control':'no-store'}}),uuid=(s:unknown)=>typeof s==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(s);
async function hash(s:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function GET(){if(!await editorIdentity())return reply({error:'Editor access required'},403);try{const rows=await env.DB!.prepare('SELECT id,payload,state,provider_id,error,created_at,updated_at FROM owner_push_sends WHERE state<>? ORDER BY created_at DESC LIMIT 30').bind('prepared').all<any>();return reply({sends:rows.results.map(r=>({id:r.id,...JSON.parse(r.payload),state:r.state,providerMessageId:r.provider_id,error:r.error,createdAt:r.created_at,updatedAt:r.updated_at}))});}catch{return reply({error:'발송 이력을 불러오지 못했어요.'},503);}}
export async function POST(request:Request){
 const owner=await editorIdentity();if(!owner)return reply({error:'Editor access required'},403);
 if(request.headers.get('Origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site'||request.headers.get('X-Gagether-Auth')!=='1')return reply({error:'Origin mismatch'},403);
 if(Number(request.headers.get('content-length')||0)>2000)return reply({error:'Payload too large'},413);
 try{const text=await request.text();if(new TextEncoder().encode(text).length>2000)return reply({error:'Payload too large'},413);const b=JSON.parse(text),at=Date.now(),readiness=fcmReadiness(env as PushEnvironment);
  if(b.action==='validate'&&Object.keys(b).length===1){if(!readiness.serverConfigured)return reply({error:readiness.reason},503);await sendFcm(env as PushEnvironment,{gameId:'wuwa',locale:'ko',title:'연결 검사 · 발송하지 않음',body:'FCM 요청 형식과 권한만 검사합니다.'},crypto.randomUUID(),true,at);return reply({validated:true,notSent:true});}
  if(!readiness.ready)return reply({error:readiness.reason,readiness},503);
  if(b.action==='prepare'&&Object.keys(b).every(k=>['action','draftId','revision'].includes(k))&&uuid(b.draftId)&&Number.isSafeInteger(b.revision)&&b.revision>0){
   const row=await env.DB!.prepare('SELECT payload,revision FROM owner_push_drafts WHERE id=?').bind(b.draftId).first<any>();if(!row||row.revision!==b.revision)return reply({error:'초안이 바뀌었어요. 최신 초안을 저장하고 다시 확인하세요.'},409);
   const draft={...JSON.parse(row.payload),id:b.draftId,revision:row.revision};if(!validPushDraft(draft))return reply({error:'초안 내용을 확인해 주세요.'},400);
   const payload=JSON.stringify({gameId:draft.gameId,locale:draft.locale,title:draft.title,body:draft.body}),audience=pushAudience(draft.gameId,draft.locale),digest=await hash(payload),duplicate=await env.DB!.prepare("SELECT id,state FROM owner_push_sends WHERE payload_hash=? AND state IN ('sending','accepted','unknown') AND created_at>? LIMIT 1").bind(digest,at-86400000).first<any>();if(duplicate)return reply({error:'같은 알림이 이미 접수됐거나 결과 확인 중이에요. 발송 이력을 확인하세요.'},409);
   const id=crypto.randomUUID();await env.DB!.prepare('INSERT INTO owner_push_sends(id,draft_id,draft_revision,owner_id,game_id,locale,topic,payload,payload_hash,state,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,b.draftId,b.revision,owner.userId,draft.gameId,draft.locale,audience.topic,payload,digest,'prepared',at+600000,at,at).run();
   return reply({confirmation:{id,...JSON.parse(payload),audience,expiresAt:at+600000}});
  }
  if(b.action==='send'&&Object.keys(b).every(k=>['action','id','confirm'].includes(k))&&uuid(b.id)&&b.confirm===true){
   const item=await env.DB!.prepare('SELECT * FROM owner_push_sends WHERE id=? AND owner_id=?').bind(b.id,owner.userId).first<any>();if(!item)return reply({error:'발송 확인 내용이 없어요.'},404);
   if(item.state!=='prepared')return reply({id:item.id,state:item.state,error:'이미 처리한 요청이에요. 접수 결과가 불명확하면 자동 재발송하지 않아요.'},409);
   if(item.expires_at<at)return reply({error:'확인 시간이 지났어요. 초안에서 다시 확인하세요.'},409);
   const claimed=await env.DB!.prepare("UPDATE owner_push_sends SET state='sending',updated_at=? WHERE id=? AND owner_id=? AND state='prepared' AND expires_at>=? AND NOT EXISTS(SELECT 1 FROM owner_push_sends x WHERE x.id<>? AND ((x.payload_hash=owner_push_sends.payload_hash AND x.created_at>?) OR (x.game_id=owner_push_sends.game_id AND x.locale=owner_push_sends.locale AND x.updated_at>?)) AND x.state IN ('sending','accepted','unknown'))").bind(at,item.id,owner.userId,at,item.id,at-86400000,at-30000).run();
   if(!claimed.meta.changes)return reply({error:'같은 대상의 알림이 처리 중이거나 방금 접수됐어요. 이력을 확인한 뒤 다시 진행하세요.'},409);
   try{const result=await sendFcm(env as PushEnvironment,JSON.parse(item.payload),item.id,false,at);if(!('providerMessageId' in result))throw new FcmError('acceptance-unknown',false);await env.DB!.prepare("UPDATE owner_push_sends SET state='accepted',provider_id=?,updated_at=? WHERE id=? AND state='sending'").bind(result.providerMessageId,Date.now(),item.id).run();return reply({id:item.id,state:'accepted',providerMessageId:result.providerMessageId,message:'FCM에 접수됐어요. 기기 전달·열람을 확인한 것은 아니에요.'});}
   catch(e){const definite=e instanceof FcmError&&e.definite,code=e instanceof FcmError?e.code:'acceptance-unknown',state=definite?'failed':'unknown';try{await env.DB!.prepare('UPDATE owner_push_sends SET state=?,error=?,updated_at=? WHERE id=? AND state=?').bind(state,code,Date.now(),item.id,'sending').run();}catch{}return reply({id:item.id,state,error:definite?'FCM이 요청을 접수하지 못했어요. 서버 설정과 권한을 확인하세요.':'접수 결과를 확인하지 못했어요. 중복을 막기 위해 자동 재발송하지 않아요.'},definite?502:503);}
  }
  return reply({error:'Invalid action'},400);
 }catch(e){if(e instanceof FcmError)return reply({error:'Firebase 연결 검사를 완료하지 못했어요. 서버 설정을 확인하세요. ('+e.code+')',code:e.code},502);return reply({error:e instanceof SyntaxError?'Invalid JSON':'요청을 처리하지 못했어요. 기존 초안과 이력을 확인하세요.'},e instanceof SyntaxError?400:503);}
}
