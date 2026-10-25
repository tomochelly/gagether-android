import {hydrateRosterDetails} from '@/lib/roster-detail-catalog';
import {z} from 'zod';
import {readCharacterRosterView} from '@/lib/roster-art-framing-store';
import {readCharacterRoster,characterRosterHealth,saveCharacterRoster} from '@/lib/character-roster-store';
import {characterRosterSchema,rosterDirectory} from '@/lib/character-roster';
import {canWriteData} from '@/lib/write-access';
import {sameOrigin} from '@/lib/store';
import {refreshCharacterRostersStep,rosterIdentity,recordRosterHealth,rosterGames} from '@/lib/character-roster-refresh';
export const dynamic='force-dynamic';
export async function GET(request:Request){const q=new URL(request.url).searchParams,game=q.get('game');try{if(q.get('manage')==='1'){if(!await canWriteData(request))return Response.json({error:'Owner or updater required'},{status:403});return Response.json({health:await characterRosterHealth()},{headers:{'Cache-Control':'no-store'}});}if(!game)return Response.json({error:'Choose a game'},{status:400});const result=await readCharacterRosterView(game);if(!result)return Response.json({error:'Roster not found'},{status:404});const {data,hash,delivery}=result,etag='"characters-'+hash+'"',headers={'Cache-Control':'public, max-age=60, stale-while-revalidate=300',ETag:etag};if(request.headers.get('If-None-Match')===etag)return new Response(null,{status:304,headers});if(q.get('id')){const character=data.characters.find(c=>c.id===q.get('id'));return character?Response.json({gameId:game,character:await hydrateRosterDetails(data,character),revision:hash},{headers}):Response.json({error:'Character not found'},{status:404});}return Response.json({data:rosterDirectory(data),revision:hash,delivery},{headers});}catch{return Response.json({error:'Saved roster unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}}
export async function POST(request:Request){
 const identity=await rosterIdentity(request),owner=sameOrigin(request)&&await canWriteData(request);if(!identity&&!owner)return Response.json({error:'Owner, updater or roster collection identity required'},{status:403});
 try{const raw=await request.text();if(new TextEncoder().encode(raw).length>4500000)return Response.json({error:'Roster too large'},{status:413});
 const schema=z.discriminatedUnion('action',[z.object({action:z.literal('refresh'),game:z.enum(rosterGames as [string,...string[]]).optional()}).strict(),z.object({action:z.literal('ingest'),data:characterRosterSchema}).strict(),z.object({action:z.literal('health'),gameId:z.enum(rosterGames as [string,...string[]]),status:z.enum(['failed','blocked','limited']),error:z.string().max(2000)}).strict()]);
 const parsed=schema.safeParse(JSON.parse(raw));if(!parsed.success)return Response.json({error:'Invalid roster request',issues:parsed.error.issues.map(i=>({path:i.path,message:i.message}))},{status:400});const b=parsed.data,at=new Date().toISOString();
 if(b.action==='refresh'){if(!owner)return Response.json({error:'Collection identity cannot request other operations'},{status:403});return Response.json(await refreshCharacterRostersStep(b.game));}
 if(b.action==='health'){const prior=(await characterRosterHealth()).find(h=>h.gameId===b.gameId);await recordRosterHealth({...prior,gameId:b.gameId,status:b.status,error:b.error,checkedAt:at,runId:identity?.run_id});return Response.json({saved:true});}
 const result=await saveCharacterRoster(b.data),readback=await readCharacterRoster(b.data.gameId);if(readback?.hash!==result.hash)throw Error('Roster pointer readback mismatch');
 await recordRosterHealth({gameId:b.data.gameId,status:'ok',checkedAt:at,lastSuccessAt:at,count:readback.data.characters.length,hash:result.hash,runId:identity?.run_id,sourceSha:identity?.sha});return Response.json({...result,readback:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Roster collection failed'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
