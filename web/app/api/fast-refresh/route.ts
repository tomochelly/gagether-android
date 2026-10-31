import {env} from 'cloudflare:workers';
import {canWriteData} from '@/lib/write-access';
import {sameOrigin} from '@/lib/store';
import {githubIdentity,refreshAudience,refreshWorkflow} from '@/lib/refresh-identity';
import {runnerLease,readRunnerHeartbeat} from '@/lib/refresh-runner';
import {runFastRefresh,performRefreshStage} from '@/lib/fast-refresh';
import {refreshTask,runGameRefresh,readRefreshTasks,readRefreshTask} from '@/lib/refresh-tasks';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
function selected(request:Request){
 const u=new URL(request.url),g=u.searchParams.get('game'),l=u.searchParams.get('lane');
 if(g===null&&l===null)return null;
 if(!g||!l||u.searchParams.getAll('game').length!==1||u.searchParams.getAll('lane').length!==1)throw Error('Choose one registered game and lane');
 const task=refreshTask(g,l);if(!task)throw Error('Unknown refresh task');return task;
}
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Origin mismatch'},{status:403,headers});
 const token=request.headers.get('X-Gagether-Refresh-Identity')||'';
 const identity=await githubIdentity(token,refreshAudience,refreshWorkflow);
 if(!identity&&!await canWriteData(request))return Response.json({error:'Authorized scheduler or editor required'},{status:403,headers});
 const url=new URL(request.url),mode=url.searchParams.get('runner'),action=url.searchParams.get('action');
 if(mode||action){
  if(!identity||!['fast','details'].includes(mode||'')||!['claim','renew','release'].includes(action||''))return Response.json({error:'Pinned scheduler identity and valid runner action required'},{status:403,headers});
  try{return Response.json({...await runnerLease(mode as 'fast'|'details',identity.run_id,action as 'claim'|'renew'|'release'),version:2},{headers});}catch{return Response.json({error:'Scheduler lease unavailable'},{status:503,headers});}
 }
 let task;try{task=selected(request);}catch(error){return Response.json({error:(error as Error).message},{status:400,headers});}
 // Selectors choose fixed jobs, never URLs, payloads, deletions or editorial writes.
 try{const result=task?await runGameRefresh(task,performRefreshStage):await runFastRefresh();return Response.json({...result,...(task?{version:2,taskKey:task.key,gameId:task.gameId,lane:task.lane}:{})},{headers});}catch{return Response.json({error:'Fast refresh failed; see status'},{status:503,headers});}
}
export async function GET(request?:Request){
 let task;try{task=request?selected(request):null;}catch(error){return Response.json({error:(error as Error).message},{status:400,headers});}
 try{
  if(task)return Response.json(await readRefreshTask(task),{headers});
  if(request&&new URL(request.url).searchParams.get('plan')==='1')return Response.json({version:2,serverTime:new Date().toISOString(),scheduler:await readRunnerHeartbeat(),tasks:(await readRefreshTasks()).map(({health,...task})=>task)},{headers});
  const row=await env.DB!.prepare("SELECT last_started_at AS lastStartedAt,last_finished_at AS lastFinishedAt,result FROM refresh_jobs WHERE id='official-fast'").first<{lastStartedAt:string;lastFinishedAt:string;result:string}>();return Response.json({version:2,intervalMinutes:10,detailReview:'independent-game-tasks',...(row?{lastStartedAt:row.lastStartedAt,lastFinishedAt:row.lastFinishedAt,result:JSON.parse(row.result||'null')}:{result:null})},{headers});
 }catch{return Response.json({error:'Refresh status unavailable'},{status:503,headers});}
}
