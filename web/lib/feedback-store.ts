import {env} from 'cloudflare:workers';
import {hashToken} from './google-login';
import type {FeedbackAttachment} from './feedback';
export type FeedbackRecord={id:string;category:string;game_id:string|null;region:string;locale:string;message:string;source_url:string;reply_to:string;page_url:string;attachments:string;state:string;mail_state:string;mail_token:string|null;mail_id:string|null;created_at:number;updated_at:number};
export const feedbackBucket=()=> (env as unknown as {BUCKET:R2Bucket}).BUCKET;
export const attachmentKey=(report:string,file:string)=>`feedback/${report}/${file}`;
export function publicReceipt(id:string){return id.slice(0,8).toUpperCase();}
export async function feedbackAllowed(key:string,maximum:number){
 const window=Math.floor(Date.now()/3600000);
 const r=await env.DB!.prepare('INSERT INTO feedback_limits(id,window,count) VALUES (?,?,1) ON CONFLICT(id) DO UPDATE SET window=excluded.window,count=CASE WHEN feedback_limits.window=excluded.window THEN feedback_limits.count+1 ELSE 1 END WHERE feedback_limits.window<>excluded.window OR feedback_limits.count<?').bind(key,window,maximum).run();
 return r.meta.changes===1;
}
export async function feedbackRateKey(ip:string){return hashToken('gagether-feedback:'+Math.floor(Date.now()/86400000)+':'+ip);}
export function feedbackAttachments(row:FeedbackRecord):FeedbackAttachment[]{try{return JSON.parse(row.attachments);}catch{return [];}}
export function feedbackView(row:FeedbackRecord){const {request_key:_,...clean}=row as FeedbackRecord&{request_key?:string};return {...clean,attachments:feedbackAttachments(row)};}
