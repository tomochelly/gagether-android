import {env} from 'cloudflare:workers';
import type {ForumComment} from '@/lib/forum';
import {z} from 'zod';
import {sameOriginAuth,authHeaders,hashToken} from '@/lib/google-login';
import {forumId,forumLocale} from '@/lib/forum';
import {forumJson} from '../route';
import {forumRate,forumRow,ForumError} from '@/lib/forum-store';
import {translateForumRow,forumCommentRow} from '@/lib/forum-translation';
export const dynamic='force-dynamic';
export async function POST(request:Request){const reply=(v:unknown,s=200)=>Response.json(v,{status:s,headers:authHeaders});if(!sameOriginAuth(request))return reply({error:'Origin mismatch'},403);try{const body=z.object({id:forumId,locale:forumLocale,ack:z.boolean(),commentId:forumId.optional()}).strict().parse(await forumJson(request,1000)),row=await forumRow(body.id);if(!row||row.state!=='active')return reply({error:'Post unavailable'},404);if(row.spoiler&&!body.ack)return reply({error:'Spoiler acknowledgement required'},428);await forumRate('translation:'+await hashToken(request.headers.get('cf-connecting-ip')||'shared-anonymous'),4);if(body.commentId){const comment=await env.DB!.prepare("SELECT id,locale,body FROM forum_comments WHERE id=? AND post_id=? AND state='active'").bind(body.commentId,row.id).first<ForumComment>();if(!comment)return reply({error:'Reply unavailable'},404);return reply(await translateForumRow(await forumCommentRow(comment),body.locale));}return reply(await translateForumRow(row,body.locale));}catch(e){return reply({error:e instanceof ForumError?e.message:'Translation unavailable'},e instanceof z.ZodError?400:e instanceof ForumError?e.status:503);}}
