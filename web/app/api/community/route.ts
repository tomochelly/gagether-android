import {env} from 'cloudflare:workers';
import {visitorSession} from '@/lib/visitor-auth-store';
import {editorIdentity} from '@/lib/editor-access';
import {authHeaders,sameOriginAuth,limitedJson,hashToken} from '@/lib/google-login';
import {readEntry} from '@/lib/store';
import {communityMembers,validReview,type CommunityReview} from '@/lib/community';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:authHeaders});
async function targetFor(id:unknown,member:unknown){
 if(typeof id!=='string'||id.length>250||typeof member!=='string'||member.length>500)return null;
 const entry=await readEntry(id);if(!entry||!communityMembers(entry).some(m=>m.key===member))return null;
 return hashToken(JSON.stringify([entry.gameId,entry.region,entry.id,member]));
}
async function permitted(account:string){
 const window=Math.floor(Date.now()/60000);
 const r=await env.DB!.prepare('INSERT INTO community_limits(account_id,window,count) VALUES (?,?,1) ON CONFLICT(account_id) DO UPDATE SET window=excluded.window,count=CASE WHEN community_limits.window=excluded.window THEN community_limits.count+1 ELSE 1 END WHERE community_limits.window<>excluded.window OR community_limits.count<30').bind(account,window).run();return r.meta.changes===1;
}
export async function GET(request:Request){try{
 const url=new URL(request.url),target=await targetFor(url.searchParams.get('entry'),url.searchParams.get('member'));if(!target)return reply({error:'Unknown pickup'},404);
 const user=await visitorSession(request.headers),moderator=url.searchParams.get('moderate')==='1'&&!!await editorIdentity();
 const offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0||offset>100000)return reply({error:'Invalid page'},400);
 const viewer=user?.id||'';
 const fields=`r.id,r.author,r.stars,r.body,r.updated_at AS updatedAt,r.revision,(r.account_id=?) AS mine,(SELECT COUNT(*) FROM community_likes l WHERE l.review_id=r.id) AS likes,EXISTS(SELECT 1 FROM community_likes l WHERE l.review_id=r.id AND l.account_id=?) AS liked,EXISTS(SELECT 1 FROM community_reports p WHERE p.review_id=r.id AND p.account_id=?) AS reported${moderator?',(SELECT COUNT(*) FROM community_reports p WHERE p.review_id=r.id) AS reports':''}`;
 const [stats,rows,mine]=await Promise.all([
 env.DB!.prepare("SELECT AVG(stars) average,COUNT(*) count,SUM(CASE WHEN body<>'' THEN 1 ELSE 0 END) comments FROM community_reviews WHERE target=? AND hidden=0").bind(target).first(),
 env.DB!.prepare(`SELECT ${fields} FROM community_reviews r WHERE target=? AND hidden=0 AND body<>'' ORDER BY updated_at DESC,id DESC LIMIT 11 OFFSET ?`).bind(viewer,viewer,viewer,target,offset).all<CommunityReview>(),
 user?env.DB!.prepare(`SELECT ${fields} FROM community_reviews r WHERE target=? AND account_id=? AND hidden=0`).bind(viewer,viewer,viewer,target,viewer).first<CommunityReview>():null
 ]);
 const clean=(r:CommunityReview)=>({...r,mine:!!r.mine,liked:!!r.liked,reported:!!r.reported});
 return reply({...stats,comments:(stats as {comments?:number})?.comments||0,reviews:rows.results.slice(0,10).map(clean),mine:mine?clean(mine):null,signedIn:!!user,canModerate:moderator,next:rows.results.length>10?offset+10:null});
 }catch{return reply({error:'Community unavailable'},503);}}
export async function POST(request:Request){
 if(!sameOriginAuth(request))return reply({error:'Origin mismatch'},403);
 try{
 let body:Record<string,unknown>;try{body=await limitedJson(request);}catch{return reply({error:'Invalid request'},400);}
 if(body.action==='moderate'){
 if(!await editorIdentity())return reply({error:'Owner required'},403);
 if(typeof body.id!=='string')return reply({error:'Invalid review'},400);
 await env.DB!.prepare('UPDATE community_reviews SET hidden=1,revision=revision+1 WHERE id=?').bind(body.id).run();return reply({ok:true});
 }
 const target=await targetFor(body.entry,body.member);if(!target)return reply({error:'Unknown pickup'},404);
 const user=await visitorSession(request.headers);if(!user)return reply({error:'Sign in required'},401);
 if(!await permitted(user.id))return reply({error:'Please wait'},429);
 const id=await hashToken(JSON.stringify([target,user.id]));
 if(body.action==='review'){
 if(!validReview(body))return reply({error:'Invalid review'},400);
 const now=Date.now(),text=String(body.text).trim();
 const result=body.revision===0?await env.DB!.prepare('INSERT INTO community_reviews(id,target,entry_id,member,account_id,author,stars,body,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(id,target,body.entry,body.member,user.id,(await hashToken('public-community:'+user.id+':'+target)).slice(0,8),body.stars,text,now,now).run():await env.DB!.prepare('UPDATE community_reviews SET stars=?,body=?,updated_at=?,revision=revision+1 WHERE id=? AND target=? AND revision=? AND hidden=0').bind(body.stars,text,now,id,target,body.revision).run();
 return result.meta.changes===1?reply({ok:true}):reply({error:'Review changed or unavailable'},409);
 }
 if(body.action==='delete'){
 if(!Number.isSafeInteger(body.revision))return reply({error:'Invalid revision'},400);
 const result=await env.DB!.prepare('DELETE FROM community_reviews WHERE id=? AND target=? AND revision=?').bind(id,target,body.revision).run();return result.meta.changes===1?reply({ok:true}):reply({error:'Review changed'},409);
 }
 if((body.action==='like'||body.action==='report')&&typeof body.id==='string'){
 const row=await env.DB!.prepare("SELECT id,account_id FROM community_reviews WHERE id=? AND target=? AND hidden=0 AND body<>''").bind(body.id,target).first<{id:string;account_id:string}>();
 if(!row||row.account_id===user.id)return reply({error:'Invalid review'},400);
 const edge=await hashToken(JSON.stringify([body.id,user.id]));
 if(body.action==='report')await env.DB!.prepare('INSERT INTO community_reports(id,review_id,account_id) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING').bind(edge,body.id,user.id).run();
 else {if(typeof body.liked!=='boolean')return reply({error:'Invalid like'},400);if(body.liked)await env.DB!.prepare('INSERT INTO community_likes(id,review_id,account_id) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING').bind(edge,body.id,user.id).run();else await env.DB!.prepare('DELETE FROM community_likes WHERE id=?').bind(edge).run();}
 return reply({ok:true});
 }
 return reply({error:'Invalid action'},400);
 }catch{return reply({error:'Community unavailable'},503);}
}
