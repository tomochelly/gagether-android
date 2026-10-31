import {canWriteData} from '@/lib/write-access';
import {games} from '@/lib/games';
import {communityResearchSources,communitySourceCoverage} from '@/lib/community-research-sources';
import {readCommunityResearchHealth,refreshCommunityResearch} from '@/lib/community-research-store';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex','Vary':'Cookie, X-Gagether-Sync-Token'};
const validGame=(id:unknown):id is string=>typeof id==='string'&&games.some(g=>g.id===id);
export async function GET(request:Request){
 if(!await canWriteData(request))return Response.json({error:'Owner or updater access required'},{status:403,headers});
 const params=new URL(request.url).searchParams,game=params.get('game')??undefined;if(params.getAll('game').length>1||[...params.keys()].some(k=>k!=='game')||game!==undefined&&!validGame(game))return Response.json({error:'Invalid game selector'},{status:400,headers});
 try{return Response.json({coverage:communitySourceCoverage(),sources:communityResearchSources(game,{includeLeaks:true}),health:await readCommunityResearchHealth(game)},{headers});}catch{return Response.json({error:'Research state unavailable'},{status:503,headers});}
}
async function input(request:Request){
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw Error();
 const reader=request.body?.getReader();if(!reader)throw Error();let text='',bytes=0;const decoder=new TextDecoder();
 try{for(;;){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>2048){await reader.cancel();throw Error();}text+=decoder.decode(part.value,{stream:true});}}finally{reader.releaseLock();}
 const value=JSON.parse(text+decoder.decode());if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==1||!validGame(value.gameId))throw Error();return value as {gameId:string};
}
export async function POST(request:Request){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin||!await canWriteData(request))return Response.json({error:'Owner or updater access required'},{status:403,headers});
 let body:{gameId:string};try{body=await input(request);}catch{return Response.json({error:'Expected one registered gameId'},{status:400,headers});}
 try{const result=await refreshCommunityResearch(body.gameId);return Response.json(result,{status:result.status==='unavailable'?503:200,headers});}catch{return Response.json({error:'Research refresh unavailable'},{status:503,headers});}
}
