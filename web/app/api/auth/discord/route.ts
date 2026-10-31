import {authCookie,authHeaders,limitedJson,sameOriginAuth} from '@/lib/google-login';
import {discordAuthorizeUrl,discordLoginCookie,accountReturnTo} from '@/lib/discord-login';
import {beginDiscordLogin,discordLoginConfig} from '@/lib/discord-auth-store';
import {visitorSession} from '@/lib/visitor-auth-store';
import type {Locale} from '@/lib/types';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!sameOriginAuth(request))return Response.json({error:'Origin mismatch'},{status:403,headers:authHeaders});
 const config=discordLoginConfig(),origin=new URL(request.url).origin;
 if(!config)return Response.json({error:'Discord login unavailable'},{status:503,headers:authHeaders});
 if(new URL(config.redirectUri).origin!==origin)return Response.json({error:'Use the configured sign-in origin'},{status:409,headers:authHeaders});
 let body:Record<string,unknown>;try{body=await limitedJson(request);}catch{return Response.json({error:'Invalid request'},{status:400,headers:authHeaders});}
 if(typeof body.locale!=='string'||!['ko','en','ja','zh'].includes(body.locale))return Response.json({error:'Invalid locale'},{status:400,headers:authHeaders});
 try{
  if(await visitorSession(request.headers))return Response.json({error:'Already signed in'},{status:409,headers:authHeaders});
  const {state,verifier}=await beginDiscordLogin(request.headers,origin,body.locale as Locale,accountReturnTo(body.returnTo));
  return Response.json({url:await discordAuthorizeUrl(config,state,verifier)},{headers:{...authHeaders,'Referrer-Policy':'no-referrer','Set-Cookie':authCookie(discordLoginCookie,state,600)}});
 }catch{return Response.json({error:'Could not start Discord sign-in'},{status:503,headers:authHeaders});}
}
