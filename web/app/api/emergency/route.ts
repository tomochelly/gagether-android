import {githubIdentity} from '@/lib/refresh-identity';
import {env} from 'cloudflare:workers';
import {editRequest,entryChanges,validateEditedEntry} from '@/lib/editor-schema';
import {readBaseData,readEditorial,writeEditorial,readEntry,resetEditorial} from '@/lib/store';
import {editorHistory} from '@/lib/editor-history';
import {applyEntryPatch} from '@/lib/editorial';
const audience='https://gagether.wiki/api/emergency';
const workflow='tomochelly/gagether-android/.github/workflows/gagether-emergency.yml@refs/heads/main';
const headers={'Cache-Control':'no-store'};
export async function POST(request:Request){
 const identity=await githubIdentity(request.headers.get('X-Gagether-Emergency-Identity')||'',audience,workflow);
 if(!identity||!/^[a-f0-9]{40}$/.test(identity.sha))return Response.json({error:'Pinned main-branch GitHub workflow identity required'},{status:403,headers});
 let stage='read-committed-plan';try{
  // The caller supplies no editable data. Read the exact signed commit from the fixed repository.
  const response=await fetch(`https://raw.githubusercontent.com/tomochelly/gagether-android/${identity.sha}/.gagether/emergency.json`,{headers:{Accept:'application/json','User-Agent':'GAGETHER-Emergency'},signal:AbortSignal.timeout(15000),redirect:'manual'});
  if(!response.ok)return Response.json({error:'Committed emergency plan unavailable',status:response.status},{status:502,headers});
  const raw=await response.text();if(raw.length>200000)return Response.json({error:'Plan too large'},{status:413,headers});const plan=JSON.parse(raw);
  if(plan.version!==1||typeof plan.requestId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(plan.requestId)||typeof plan.reason!=='string'||plan.reason.length<5||!['edit','reset'].includes(plan.action)||typeof plan.dryRun!=='boolean')return Response.json({error:'Invalid plan envelope'},{status:400,headers});
  stage='audit-ready';const actor=`github:${identity.actor}:${plan.requestId}`;
  await editorHistory();const replay=await env.DB!.prepare('SELECT seq FROM editorial_history WHERE actor=? ORDER BY seq DESC LIMIT 1').bind(actor).first<{seq:number}>();if(replay)return Response.json({ok:true,replayed:true,requestId:plan.requestId,historySeq:replay.seq},{headers});
  const parsed=editRequest.safeParse(plan.edit);if(!parsed.success||parsed.data.target!=='entry'||!parsed.data.id!)return Response.json({error:'Invalid entry edit',details:!parsed.success?parsed.error.issues:[]},{status:400,headers});
  const data=parsed.data,key='entry:'+data.id,existing=(await readEditorial(key))[0];
  if((existing?.revision||0)!==data.revision)return Response.json({error:'Revision conflict',actualRevision:existing?.revision||0},{status:409,headers});
  const base=(await readBaseData({id:data.id})).entries.find(e=>e.id===data.id!);
  if(plan.action==='reset'){
   if(!existing)return Response.json({error:'Override not found'},{status:404,headers});
   if(plan.dryRun)return Response.json({ok:true,dryRun:true,id:data.id,revision:data.revision},{headers});
   await env.BUCKET!.put('recovery/'+plan.requestId+'.json',JSON.stringify({key,base:base||null,editorial:existing||null,actor,commit:identity.sha,at:new Date().toISOString()}),{httpMetadata:{contentType:'application/json'}});
   if(!await resetEditorial(key,data.revision,actor))return Response.json({error:'Revision conflict'},{status:409,headers});
  }else{
   if(!base&&!existing&&!data.create)return Response.json({error:'New entries require create:true and complete fields'},{status:400,headers});
   const patch=entryChanges.safeParse(data.changes);if(!patch.success)return Response.json({error:'Invalid fields',details:patch.error.issues},{status:400,headers});
   const payload:Record<string,unknown>={...existing?.payload,...patch.data},removed=new Set(Array.isArray(existing?.payload.$unset)?existing.payload.$unset as string[]:[]);
   for(const field of Object.keys(patch.data))removed.delete(field);for(const field of data.removeFields||[]){removed.add(field);delete payload[field];}if(removed.size)payload.$unset=[...removed];else delete payload.$unset;
   if(!base&&!existing){payload.id=data.id;payload.verifiedAt=new Date().toISOString();}
   const valid=validateEditedEntry(applyEntryPatch(base,payload,data.id!));if(!valid.ok)return Response.json({error:valid.error},{status:400,headers});
   if(plan.dryRun)return Response.json({ok:true,dryRun:true,id:data.id,revision:data.revision},{headers});
   await env.BUCKET!.put('recovery/'+plan.requestId+'.json',JSON.stringify({key,base:base||null,editorial:existing||null,actor,commit:identity.sha,at:new Date().toISOString()}),{httpMetadata:{contentType:'application/json'}});
   if(!await writeEditorial(key,payload,data.revision,actor))return Response.json({error:'Revision conflict'},{status:409,headers});
  }
  const persisted=(await readEditorial(key))[0];return Response.json({ok:true,requestId:plan.requestId,id:data.id,revision:persisted?.revision||0,entry:await readEntry(data.id!)||null},{headers});
 }catch(error){console.error('Emergency operation failed',stage,error instanceof Error?error.message.slice(0,500):'Unknown failure');return Response.json({error:'Emergency operation incomplete; inspect history before retrying',stage},{status:503,headers});}
}
