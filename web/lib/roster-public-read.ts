import {englishRosterSummary,englishRosterDetails} from './roster-english';
import {deliveryContext} from './public-delivery-context';
import {currentRosterReadRevision} from '@/lib/roster-read-revision';
import {matchesIfNoneMatch} from '@/lib/http-cache';
import {publicRosterResponse} from '@/lib/public-roster-cache';
import {characterRosterSchema,rosterCharacterSchema} from '@/lib/character-roster';
import {canWriteData} from '@/lib/write-access';
import {games} from '@/lib/games';
import {readPublicRosterSlice,savePublicRosterSlices} from './roster-public-slices';
import {reviewedRosterInformation} from './reviewed-roster-information';
async function materialDetails(game:string,character:import('./character-roster').RosterCharacter){const {withRosterMaterials}=await import('./roster-material-data');return withRosterMaterials(game,await englishRosterDetails(game,reviewedRosterInformation(game,character)));}
export async function readPublicCharacterRoster(request:Request){
 const q=new URL(request.url).searchParams,game=q.get('game'),id=q.get('id');
 try{
  if(q.get('manage')==='1'){if(!await canWriteData(request))return Response.json({error:'Owner or updater required'},{status:403,headers:{'Cache-Control':'no-store'}});const {characterRosterHealth}=await import('@/lib/character-roster-store');return Response.json({health:await characterRosterHealth()},{headers:{'Cache-Control':'no-store'}});}
  if(!game)return Response.json({error:'Choose a game'},{status:400});
  if(!games.some(g=>g.id===game&&g.id!=='wuwa')||id&&id.length>200)return Response.json({error:'Roster not found'},{status:404});
  return await publicRosterResponse(request,{slot:game+':'+(id?'character:'+id:'directory'),directory:!id,revision:()=>currentRosterReadRevision(game),
   validate(value){if(id){if(value.gameId!==game||value.character?.id!==id)throw Error('Cached character identity mismatch');rosterCharacterSchema.parse(value.character);}else{if(value.data?.gameId!==game)throw Error('Cached roster identity mismatch');characterRosterSchema.parse({...value.data,characters:value.data.characters.map(({detailsDeferred,...c}:any)=>{if(detailsDeferred!==undefined&&typeof detailsDeferred!=='boolean')throw Error('Invalid detail marker');return c;})});}},
   async read(readRevision){
    if(id){
     const revision=readRevision,slice=revision&&await readPublicRosterSlice(game,id,revision);
     if(slice&&'missing'in slice)return Response.json({error:'Character not found'},{status:404});
     if(slice&&'data'in slice){const {hydrateRosterDetails}=await import('./roster-detail-catalog'),data=slice.data;return Response.json({gameId:game,character:await materialDetails(game,await hydrateRosterDetails(data,data.characters[0])),revision,source:{sourceName:data.sourceName,sourceUrls:data.sourceUrls,checkedAt:data.checkedAt,coverage:slice.source.coverage}},{headers:{'Cache-Control':'public, max-age=60, stale-while-revalidate=300',ETag:'"characters-'+revision+'"','X-Gagether-Roster-Read':'character-slice'}});}
    }
    const [{readCharacterRosterView},{rosterDirectory},{hydrateRosterDetails}]=await Promise.all([import('@/lib/roster-art-framing-store'),import('@/lib/character-roster'),import('@/lib/roster-detail-catalog')]);
    const result=await readCharacterRosterView(game);if(!result)return Response.json({error:'Roster not found'},{status:404});
    if(result.cacheRevision&&!result.error){const prepare=()=>savePublicRosterSlices(result.data,result.cacheRevision!).catch(error=>console.warn('Public detail preparation failed',game,String(error).slice(0,200))),context=deliveryContext();if(context)context.waitUntil(prepare());else await prepare();}
    const {data,delivery}=result,revision=!id&&result.cacheRevision||result.hash,etag='"characters-'+revision+'"',headers={'Cache-Control':result.error?'no-store':'public, max-age=60, stale-while-revalidate=300',ETag:etag};
    const character=id?data.characters.find(c=>c.id===id):undefined;if(id&&!character)return Response.json({error:'Character not found'},{status:404});
    if(matchesIfNoneMatch(request.headers.get('If-None-Match'),etag))return new Response(null,{status:304,headers});
    return character?Response.json({gameId:game,character:await materialDetails(game,await hydrateRosterDetails(data,character)),revision,source:{sourceName:data.sourceName,sourceUrls:data.sourceUrls,checkedAt:data.checkedAt,coverage:data.coverage}},{headers}):Response.json({data:rosterDirectory({...data,characters:data.characters.map(c=>englishRosterSummary(game,reviewedRosterInformation(game,c)))}),revision,delivery},{headers});
   }});
 }catch{return Response.json({error:'Saved roster unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
