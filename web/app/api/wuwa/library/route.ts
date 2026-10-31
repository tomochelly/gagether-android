import {matchesIfNoneMatch} from '@/lib/http-cache';
import {publicRosterResponse} from '@/lib/public-roster-cache';
import {currentWuwaReadRevision} from '@/lib/roster-read-revision';
import {validateWuwaReference,validateWuwaCharacter} from '@/lib/wuwa-reference';
import {canWriteData} from '@/lib/write-access';
import {sameOrigin} from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const q=new URL(request.url).searchParams,view=q.get('view'),id=q.get('id');
 if(view&&!['directory','combat'].includes(view)||id&&(id.length>200||!!view))return Response.json({error:'Invalid reference view'},{status:400});
 try{return await publicRosterResponse(request,{slot:'wuwa:'+(id?'character:'+id:view||'full'),directory:!id,revision:currentWuwaReadRevision,
  validate(value){if(id){if(value.gameId!=='wuwa'||value.character?.id!==id)throw Error('Cached resonator mismatch');validateWuwaCharacter(value.character);}else{if((value.view||null)!==view)throw Error('Cached reference scope mismatch');validateWuwaReference(value.data);}},
  async read(){
   const {readWuwaReferenceView}=await import('@/lib/wuwa-art-framing-store'),{data,hash,delivery}=await readWuwaReferenceView(),etag='"wuwa-reference-'+hash+'"',headers={'Cache-Control':'public, max-age=60, stale-while-revalidate=300',ETag:etag};
   if(id){const character=data.characters.find(c=>c.id===id);if(!character)return Response.json({error:'Character not found'},{status:404});return Response.json({gameId:'wuwa',character,revision:hash},{headers});}
   if(matchesIfNoneMatch(request.headers.get('If-None-Match'),etag))return new Response(null,{status:304,headers});
   const projected=view?{...data,characters:data.characters.map(c=>({...c,skills:[],chains:[]})),cycles:view==='directory'?[]:data.cycles}:data;
   return Response.json({data:projected,delivery,revision:hash,...view?{view}:{}},{headers});
  }});}catch{return Response.json({error:'Reference data temporarily unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
export async function POST(request:Request){const {refreshWuwaReferenceStep}=await import('@/lib/wuwa-reference-store');if(!sameOrigin(request)||!await canWriteData(request))return Response.json({error:'Owner or updater required'},{status:403});try{const body=await request.json();if(!body||typeof body!=='object'||!('action' in body)||body.action!=='refresh'||Object.keys(body).some(k=>k!=='action'))return Response.json({error:'Only the fixed refresh action is supported'},{status:400});return Response.json(await refreshWuwaReferenceStep(true),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Reference refresh failed'},{status:503});}}
