import {editorIdentity} from '@/lib/editor-access';
import {authHeaders,limitedJson,sameOriginAuth} from '@/lib/google-login';
import {discordHandoffStatus,saveDiscordHandoff} from '@/lib/discord-secret-handoff-store';
export const dynamic='force-dynamic';
const headers={...authHeaders,'Referrer-Policy':'no-referrer'};
export async function GET(){
 if(!await editorIdentity())return Response.json({error:'Forbidden'},{status:403,headers});
 try{return Response.json(await discordHandoffStatus(),{headers});}catch{return Response.json({error:'Setup temporarily unavailable'},{status:503,headers});}
}
export async function POST(request:Request){
 if(!await editorIdentity())return Response.json({error:'Forbidden'},{status:403,headers});
 if(!sameOriginAuth(request))return Response.json({error:'Origin mismatch'},{status:403,headers});
 try{const body=await limitedJson(request),result=await saveDiscordHandoff(body);return Response.json(result.ok?{ok:true}: {error:result.error},{status:result.status,headers});}catch{return Response.json({error:'Could not save encrypted setup'},{status:503,headers});}
}
