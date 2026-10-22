import {env} from 'cloudflare:workers';
import {editorIdentity} from '@/lib/editor-access';
import {readData} from '@/lib/store';
import {editorHistory} from '@/lib/editor-history';
import {healthTable,catalogIssues} from '@/lib/service-health';
import {reviewQueue} from '@/lib/collection-store';
import {collectionCoverage} from '@/lib/collection-review';
export async function GET(){
 if(!await editorIdentity())return Response.json({error:'Editor access required'},{status:403});
 await healthTable();const [data,history,row,job]=await Promise.all([readData({includeHidden:true}),editorHistory(),env.DB!.prepare("SELECT payload FROM operations_health WHERE key='refresh'").first<{payload:string}>(),env.DB!.prepare("SELECT last_finished_at,result FROM refresh_jobs WHERE id='official-fast'").first<{last_finished_at:string;result:string}>()]);
 const health=row?JSON.parse(row.payload):null,last=health?.lastAttempt||job?.last_finished_at;
 const transitions=data.entries.filter(e=>['pickup','weapon'].includes(e.kind)&&e.startAt&&e.endAt).flatMap(e=>[{id:e.id,at:e.startAt,type:'start'},{id:e.id,at:e.endAt,type:'end'}]).sort((a,b)=>a.at!.localeCompare(b.at!));
 return Response.json({health,latest:job?JSON.parse(job.result||'null'):null,stale:!last||Date.now()-Date.parse(last)>30*60000,persistent:data.persistent,issues:catalogIssues(data.entries),lastTransition:transitions.filter(t=>Date.parse(t.at!)<=Date.now()).at(-1),nextTransition:transitions.find(t=>Date.parse(t.at!)>Date.now()),history,entries:data.entries.length,reviewQueue:await reviewQueue(100),coverage:collectionCoverage(data.entries)},{headers:{'Cache-Control':'no-store'}});
}
