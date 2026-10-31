import {env} from 'cloudflare:workers';
import {visitorSession} from '@/lib/visitor-auth-store';
import {authHeaders,sameOriginAuth} from '@/lib/google-login';
import {emptyProfile,parseProfile,profileLimit} from '@/lib/account-profile';
export const dynamic='force-dynamic';
const response=(value:unknown,status=200)=>Response.json(value,{status,headers:authHeaders});
async function read(id:string){
 const row=await env.DB!.prepare('SELECT revision,payload FROM visitor_profiles WHERE account_id=?').bind(id).first<{revision:number;payload:string}>();
 return row?{revision:row.revision,profile:parseProfile(JSON.parse(row.payload))}:{revision:0,profile:emptyProfile()};
}
export async function GET(request:Request){
 try{const user=await visitorSession(request.headers);if(!user)return response({error:'Sign in required'},401);return response({accountId:user.id,...await read(user.id)});}catch{return response({error:'Sync unavailable'},503);}
}
export async function POST(request:Request){
 if(!sameOriginAuth(request))return response({error:'Origin mismatch'},403);
 try{
  const user=await visitorSession(request.headers);if(!user)return response({error:'Sign in required'},401);
  let body:{accountId:string;revision:number;profile:unknown};
  try{
   const reader=request.body?.getReader();if(!reader)return response({error:'Body required'},400);
   const decoder=new TextDecoder();let text='',bytes=0;
   while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>profileLimit+8192){await reader.cancel();return response({error:'Sync storage limit'},413);}text+=decoder.decode(part.value,{stream:true});}
   body=JSON.parse(text+decoder.decode());
  }catch{return response({error:'Invalid sync document'},400);}
  // The cookie authorizes the write. A client account ID only detects a switched session.
  if(body.accountId!==user.id)return response({error:'Account changed'},409);
  if(!Number.isSafeInteger(body.revision)||body.revision<0)return response({error:'Invalid revision'},400);
  let profile;try{profile=parseProfile(body.profile);}catch{return response({error:'Invalid profile or storage limit'},400);}
  // Older open tabs do not know this optional field. Their other preferences
  // can still change without deleting a layout saved on an updated device.
  if(!(body.profile as Record<string,unknown>).layouts&&body.revision>0){const previous=await read(user.id);if(previous.revision!==body.revision)return response({error:'Revision changed'},409);if(previous.profile.layouts)profile=parseProfile({...profile,layouts:previous.profile.layouts});}
  const payload=JSON.stringify(profile),now=Date.now();
  const result=body.revision===0
   ?await env.DB!.prepare('INSERT INTO visitor_profiles(account_id,revision,payload,updated_at) VALUES (?,1,?,?) ON CONFLICT(account_id) DO NOTHING').bind(user.id,payload,now).run()
   :await env.DB!.prepare('UPDATE visitor_profiles SET revision=revision+1,payload=?,updated_at=? WHERE account_id=? AND revision=?').bind(payload,now,user.id,body.revision).run();
  if(result.meta.changes!==1)return response({error:'Revision changed'},409);
  return response({accountId:user.id,revision:body.revision+1,profile});
 }catch{return response({error:'Sync unavailable'},503);}
}
