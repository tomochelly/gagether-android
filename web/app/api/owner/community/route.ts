import {env} from 'cloudflare:workers';
import {editorIdentity} from '@/lib/editor-access';
import {authHeaders} from '@/lib/google-login';
export const dynamic='force-dynamic';
export async function GET(){
 if(!await editorIdentity())return Response.json({error:'Forbidden'},{status:403,headers:authHeaders});
 try{const rows=await env.DB!.prepare('SELECT r.id,r.entry_id AS entry,r.member,r.body,r.stars,COUNT(p.id) reports FROM community_reviews r JOIN community_reports p ON p.review_id=r.id WHERE r.hidden=0 GROUP BY r.id ORDER BY reports DESC,r.updated_at DESC LIMIT 50').all();return Response.json({reviews:rows.results},{headers:authHeaders});}catch{return Response.json({error:'Unavailable'},{status:503,headers:authHeaders});}
}
