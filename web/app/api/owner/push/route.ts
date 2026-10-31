import {env} from 'cloudflare:workers';
import {editorIdentity} from '@/lib/editor-access';
import {validPushDraft,pushAudience,pushReadiness} from '@/lib/owner-push';
import {fcmReadiness,type PushEnvironment} from '@/lib/fcm-server';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'},reply=(data:unknown,status=200)=>Response.json(data,{status,headers});
export async function GET(){
 if(!await editorIdentity())return reply({error:'Editor access required'},403);
 try{const r=await env.DB!.prepare('SELECT id,payload,revision,updated_at FROM owner_push_drafts ORDER BY updated_at DESC LIMIT 100').all<any>();return reply({readiness:fcmReadiness(env as PushEnvironment),drafts:r.results.map(r=>({...JSON.parse(r.payload),id:r.id,revision:r.revision,updatedAt:r.updated_at})),recipientCount:null});}catch{return reply({error:'초안 목록을 불러오지 못했어요.'},503);}
}
export async function POST(request:Request){
 if(!await editorIdentity())return reply({error:'Editor access required'},403);
 if(request.headers.get('Origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site'||request.headers.get('X-Gagether-Auth')!=='1')return reply({error:'Origin mismatch'},403);
 if(Number(request.headers.get('content-length')||0)>5000)return reply({error:'Payload too large'},413);
 try{const text=await request.text();if(new TextEncoder().encode(text).length>5000)return reply({error:'Payload too large'},413);const d=JSON.parse(text);if(!validPushDraft(d))return reply({error:'게임·언어·제목·내용을 확인해 주세요.'},400);
  const payload=JSON.stringify({gameId:d.gameId,locale:d.locale,title:d.title.trim(),body:d.body.trim()}),at=Date.now();
  const r=d.revision===0?await env.DB!.prepare('INSERT INTO owner_push_drafts(id,payload,revision,updated_at) SELECT ?,?,1,? WHERE (SELECT COUNT(*) FROM owner_push_drafts)<100 ON CONFLICT(id) DO NOTHING').bind(d.id,payload,at).run():await env.DB!.prepare('UPDATE owner_push_drafts SET payload=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(payload,at,d.id,d.revision).run();
  if(!r.meta.changes)return reply({error:'다른 기기에서 초안이 바뀌었거나 최대100개에 도달했어요. 입력은 그대로 두고 저장된 초안을 확인해 주세요.'},409);
  const row=await env.DB!.prepare('SELECT id,payload,revision,updated_at FROM owner_push_drafts WHERE id=?').bind(d.id).first<any>();if(!row||row.payload!==payload||row.revision!==d.revision+1)throw Error('Readback');
  return reply({draft:{...JSON.parse(row.payload),id:row.id,revision:row.revision,updatedAt:row.updated_at},audience:pushAudience(d.gameId,d.locale),readiness:fcmReadiness(env as PushEnvironment)});
 }catch(e){return reply({error:e instanceof SyntaxError?'Invalid JSON':'저장 결과를 확인하지 못했어요. 입력을 보존한 채 초안 목록을 다시 확인해 주세요.'},e instanceof SyntaxError?400:503);}
}
