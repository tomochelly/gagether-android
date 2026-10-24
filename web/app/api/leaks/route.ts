import {z} from 'zod';
import {readLeaks,leakHistory,leakHealth,leakQueue,saveLeak,localizeLeak,enrichLeak,refreshLeaksStep,LeakConflict} from '@/lib/leaks-store';
import {leakSchema} from '@/lib/leaks';
import {games} from '@/lib/games';
import {canWriteData} from '@/lib/write-access';
import {sameOrigin} from '@/lib/store';
export const dynamic='force-dynamic';
const noindex={'X-Robots-Tag':'noindex, nofollow, noarchive','Cache-Control':'no-store'};
const actionSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('refresh'),force:z.boolean().optional()}).strict(),
 z.object({action:z.literal('enrich'),id:leakSchema.shape.id,expectedRevision:z.number().int().min(0),bodyHash:leakSchema.shape.bodyHash,images:leakSchema.shape.images.optional(),videos:leakSchema.shape.videos,localized:leakSchema.shape.localized.optional()}).strict(),
 z.object({action:z.literal('localize'),id:leakSchema.shape.id,expectedRevision:z.number().int().min(0),bodyHash:leakSchema.shape.bodyHash,localized:leakSchema.shape.localized}).strict(),
 z.object({action:z.literal('restore'),id:z.string().regex(/^[a-z0-9_-]{1,100}$/),expectedRevision:z.number().int().min(0),restoreRevision:z.number().int().min(0)}).strict(),
 z.object({action:z.literal('sync'),items:z.array(z.object({item:leakSchema,expectedRevision:z.number().int().min(0)}).strict()).min(1).max(20)}).strict()
]);
export async function GET(request:Request){const q=new URL(request.url).searchParams;try{
 if(q.get('manage')==='1'){if(!await canWriteData(request))return Response.json({error:'Authorized updater or editor required'},{status:403,headers:noindex});if(q.get('id'))return Response.json({history:await leakHistory(q.get('id')!)},{headers:noindex});return Response.json({health:await leakHealth(),queue:await leakQueue(),items:await readLeaks()},{headers:noindex});}
 const gameId=q.get('game');if(!gameId||!games.some(g=>g.id===gameId))return Response.json({error:'Choose a registered game'},{status:400,headers:noindex});if(q.get('ack')!=='1')return Response.json({error:'Spoiler acknowledgement required'},{status:428,headers:noindex});return Response.json({gameId,items:await readLeaks(gameId),contentType:'unconfirmed-community-information',excludedFrom:['calendar','notifications','official-notices']},{headers:noindex});
 }catch{return Response.json({error:'Leak information temporarily unavailable'},{status:503,headers:noindex});}}
export async function POST(request:Request){
 if(!sameOrigin(request)||!await canWriteData(request))return Response.json({error:'Authorized updater or editor required'},{status:403,headers:noindex});if(Number(request.headers.get('content-length')||0)>1000000)return Response.json({error:'Payload too large'},{status:413,headers:noindex});
 try{const text=await request.text();if(new TextEncoder().encode(text).length>1000000)return Response.json({error:'Payload too large'},{status:413,headers:noindex});const body=actionSchema.parse(JSON.parse(text));
 if(body.action==='refresh')return Response.json(await refreshLeaksStep(body.force===true),{headers:noindex});
 if(body.action==='enrich')return Response.json({ok:true,...await enrichLeak(body.id,body.expectedRevision,body.bodyHash,{images:body.images,videos:body.videos,localized:body.localized})},{headers:noindex});
 if(body.action==='localize')return Response.json({ok:true,...await localizeLeak(body.id,body.expectedRevision,body.bodyHash,body.localized)},{headers:noindex});
 if(body.action==='restore'){const old=(await leakHistory(body.id)).find(x=>x.revision===body.restoreRevision);if(!old)return Response.json({error:'History revision not found'},{status:404,headers:noindex});const saved=await saveLeak({...old,manual:true},body.expectedRevision);return Response.json({ok:true,...saved,items:await readLeaks(old.gameId)},{headers:noindex});}
 const results:Record<string,unknown>[]=[];for(const row of body.items){try{results.push({id:row.item.id,ok:true,...await saveLeak({...row.item,manual:true},row.expectedRevision)})}catch(e){const items=(await readLeaks()).filter(x=>results.some(r=>r.id===x.id));return Response.json({ok:false,partial:results.length>0,results,failedId:row.item.id,error:e instanceof LeakConflict?e.message:'Item storage failed',items},{status:e instanceof LeakConflict?409:503,headers:noindex});}}const readback=await readLeaks();return Response.json({ok:true,results,items:readback.filter(x=>results.some(r=>r.id===x.id))},{headers:noindex});
 }catch(e){if(e instanceof z.ZodError)return Response.json({error:e.issues.map(i=>i.path.join('.')+': '+i.message).join('; ')},{status:400,headers:noindex});if(e instanceof SyntaxError)return Response.json({error:'Valid JSON required'},{status:400,headers:noindex});return Response.json({error:e instanceof LeakConflict?e.message:'Storage unavailable. Existing content was retained.'},{status:e instanceof LeakConflict?409:503,headers:noindex});}
}
