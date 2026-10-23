import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {canWriteData} from '@/lib/write-access';
import {readData,sameOrigin} from '@/lib/store';
import {reviewQueue} from '@/lib/collection-store';
import {collectionCoverage} from '@/lib/collection-review';
import {effectiveRegion} from '@/lib/presentation';
import {games} from '@/lib/games';
import {artworkAudit} from '@/lib/artwork-audit';
import {wikiCoverage} from '@/lib/wiki-coverage';
import {importCapturedBodies} from '@/lib/source-body-store';
import {importWuwaWeapons} from '@/lib/wuwa-weapon-store';
import {fetchReviewDocument,noticeSourceId} from '@/lib/official-collection';
const headers={'Cache-Control':'no-store'};
export async function GET(request:Request){
 if(!await canWriteData(request))return Response.json({error:'Authorized reviewer required'},{status:403,headers});
 const url=new URL(request.url),id=url.searchParams.get('id');
 if(id){if(!/^[a-f0-9]{64}$/.test(id))return Response.json({error:'Invalid document'},{status:400,headers});const row=await env.DB!.prepare('SELECT payload,body_hash FROM official_documents WHERE id=?').bind(id).first<{payload:string;body_hash:string}>();if(!row)return Response.json({error:'Not found'},{status:404,headers});const body=await env.BUCKET!.get('official-documents/'+id+'/'+row.body_hash);return Response.json({document:JSON.parse(row.payload),body:body?await body.json():null},{headers});}
 const data=await readData({automatic:true});return Response.json({queue:await reviewQueue(250),coverage:collectionCoverage(data.entries),artwork:artworkAudit(data.entries),wiki:wikiCoverage(data.entries)},{headers});
}
export async function POST(request:Request){
 if(!sameOrigin(request)||!await canWriteData(request))return Response.json({error:'Authorized reviewer required'},{status:403,headers});
 try{
  const raw=await request.text();if(raw.length>16000)return Response.json({error:'Payload too large'},{status:413,headers});
  const input=JSON.parse(raw);
  const importInput=z.object({action:z.literal('import'),ids:z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1).max(25).optional(),limit:z.number().int().min(1).max(100).optional()}).strict().safeParse(input);
  if(importInput.success)return Response.json({ok:true,...await importCapturedBodies(importInput.data.ids,importInput.data.limit),weapons:await importWuwaWeapons(importInput.data.ids)},{headers});
  const fetchInput=z.object({action:z.literal('fetch'),id:z.string().regex(/^[a-f0-9]{64}$/)}).strict().safeParse(input);
  if(fetchInput.success){
   const row=await env.DB!.prepare('SELECT payload FROM official_documents WHERE id=?').bind(fetchInput.data.id).first<{payload:string}>();
   if(!row)return Response.json({error:'Known official document required'},{status:404,headers});
   const d=JSON.parse(row.payload);
   if(Date.now()-Date.parse(d.checkedAt)<60000)return Response.json({error:'Document recently fetched; retry later'},{status:429,headers});
   const sourceId=noticeSourceId(d.url);
   if(!sourceId)return Response.json({error:'Unsupported stored source identity'},{status:400,headers});
   const document=await fetchReviewDocument({gameId:d.gameId,region:d.region,locale:d.locale,id:sourceId,title:d.title,url:d.url,publishedAt:d.publishedAt});
   return Response.json({ok:document.sourceAccess==='body',document},{headers});
  }
  const p=z.object({action:z.literal('reviewed'),id:z.string().regex(/^[a-f0-9]{64}$/),bodyHash:z.string().regex(/^[a-f0-9]{64}$/),entryIds:z.array(z.string().max(160)).min(1).max(30)}).strict().safeParse(input);if(!p.success)return Response.json({error:'Invalid review receipt'},{status:400,headers});
  const row=await env.DB!.prepare('SELECT game_id,region,url,body_hash,status,payload FROM official_documents WHERE id=?').bind(p.data.id).first<{game_id:string;region:any;url:string;body_hash:string;status:string;payload:string}>();if(!row||row.body_hash!==p.data.bodyHash)return Response.json({error:'Document changed; review current evidence'},{status:409,headers});
  if(JSON.parse(row.payload).sourceAccess!=='body')return Response.json({error:'Full original body must be read before review completion'},{status:400,headers});
  const all=(await readData({automatic:true})).entries,game=games.find(g=>g.id===row.game_id)!;
  if(p.data.entryIds.some(id=>!all.some(e=>e.id===id&&e.gameId===row.game_id&&effectiveRegion(game,e.region)===effectiveRegion(game,row.region)&&[e.sourceUrl,...Object.values(e.localizationSources||{}),...(e.relatedSources||[]).map(s=>s.url)].includes(row.url))))return Response.json({error:'Reviewed entries must reference this source in the same actual service'},{status:400,headers});
  if(row.status==='reviewed')return Response.json({ok:true,unchanged:true},{headers});
  const verifiedAt=new Date().toISOString(),r=await env.DB!.prepare("UPDATE official_documents SET reviewed_hash=?,status='reviewed',verified_at=?,entry_ids=? WHERE id=? AND body_hash=?").bind(p.data.bodyHash,verifiedAt,JSON.stringify(p.data.entryIds),p.data.id,p.data.bodyHash).run();
  return Response.json({ok:!!r.meta.changes,verifiedAt},{status:r.meta.changes?200:409,headers});
 }catch{return Response.json({error:'Review receipt failed'},{status:400,headers});}
}
