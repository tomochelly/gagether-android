import {env} from 'cloudflare:workers';
import {canWriteData} from '@/lib/write-access';
import {sameOrigin} from '@/lib/store';
import {verifyRefreshIdentity} from '@/lib/refresh-identity';
import {runFastRefresh} from '@/lib/fast-refresh';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Origin mismatch'},{status:403,headers});
 const token=request.headers.get('X-Gagether-Refresh-Identity')||'';
 if(!await verifyRefreshIdentity(token)&&!await canWriteData(request))return Response.json({error:'Authorized scheduler or editor required'},{status:403,headers});
 // The caller can trigger predefined reads only; no supplied URLs, entry data or deletions are accepted.
 try{return Response.json(await runFastRefresh(),{headers});}catch{return Response.json({error:'Fast refresh failed; see status'},{status:503,headers});}
}
export async function GET(){
 try{const row=await env.DB!.prepare("SELECT last_started_at AS lastStartedAt,last_finished_at AS lastFinishedAt,result FROM refresh_jobs WHERE id='official-fast'").first<{lastStartedAt:string;lastFinishedAt:string;result:string}>();return Response.json({intervalMinutes:10,detailReview:'hourly',...(row?{lastStartedAt:row.lastStartedAt,lastFinishedAt:row.lastFinishedAt,result:JSON.parse(row.result||'null')}:{result:null})},{headers});}catch{return Response.json({error:'Refresh status unavailable'},{status:503,headers});}
}
