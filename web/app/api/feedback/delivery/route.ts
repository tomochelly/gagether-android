import {env} from 'cloudflare:workers';
import {canWriteData} from '@/lib/write-access';
import {sameOrigin} from '@/lib/store';
import {authHeaders,randomToken,limitedJson} from '@/lib/google-login';
import {feedbackRecipient} from '@/lib/feedback';
import {feedbackView,type FeedbackRecord} from '@/lib/feedback-store';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:authHeaders});
export async function POST(request:Request){
 if(!await canWriteData(request)||!sameOrigin(request))return reply({error:'Owner/updater required'},403);
 try{const body=await limitedJson(request),now=Date.now();
  if(body.action==='claim'){
   const rows=await env.DB!.prepare("SELECT * FROM feedback_requests WHERE mail_state='queued' ORDER BY created_at LIMIT 5").all<FeedbackRecord>();const claimed=[];
   for(const row of rows.results){const token=randomToken();const r=await env.DB!.prepare("UPDATE feedback_requests SET mail_state='sending',mail_token=?,updated_at=? WHERE id=? AND mail_state='queued'").bind(token,now,row.id).run();if(r.meta.changes===1)claimed.push({...feedbackView(row),mail_state:'sending',mail_token:token});}
   return reply({recipient:feedbackRecipient,reports:claimed});
  }
  if(typeof body.id!=='string'||!/^[-a-f0-9]{36}$/.test(body.id))return reply({error:'Invalid report'},400);
  if(body.action==='reviewed'){await env.DB!.prepare("UPDATE feedback_requests SET state='reviewed',updated_at=? WHERE id=?").bind(now,body.id).run();return reply({ok:true});}
  if(body.action==='retry'){
   if(body.sentChecked!==true||typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token))return reply({error:'Check Gmail Sent before retrying'},400);
   const r=await env.DB!.prepare("UPDATE feedback_requests SET mail_state='queued',mail_token=NULL,updated_at=? WHERE id=? AND mail_token=? AND mail_id IS NULL AND (mail_state='failed' OR mail_state='uncertain' AND updated_at<=?)").bind(now,body.id,body.token,now-15*60000).run();
   return r.meta.changes===1?reply({ok:true}):reply({error:'Retry held: already sent, claim changed, or wait fifteen minutes'},409);
  }
  if(['sent','uncertain','failed'].includes(String(body.action))&&typeof body.token==='string'&&/^[a-f0-9]{64}$/.test(body.token)){
   const messageId=body.action==='sent'&&typeof body.messageId==='string'&&body.messageId.length<=200?body.messageId:null;if(body.action==='sent'&&!messageId)return reply({error:'Provider message ID required'},400);
   const r=await env.DB!.prepare("UPDATE feedback_requests SET mail_state=?,mail_id=?,updated_at=? WHERE id=? AND mail_state IN ('sending','uncertain','failed') AND mail_token=?").bind(body.action,messageId,now,body.id,body.token).run();return r.meta.changes===1?reply({ok:true}):reply({error:'Claim changed'},409);
  }
  return reply({error:'Invalid action'},400);
 }catch{return reply({error:'Outbox unavailable'},503);}
}
