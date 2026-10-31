import {authHeaders,authCookie,loginCookie,sessionCookie,sessionSeconds,readAuthCookie,sameOriginAuth,limitedJson,verifyGoogleCredential} from '@/lib/google-login';
import {googleLoginClientId,beginGoogleLogin,consumeGoogleChallenge,createVisitorSession} from '@/lib/visitor-auth-store';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(request.headers.get('x-gagether-auth')!=='1'||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Same-origin request required'},{status:403,headers:authHeaders});
 const clientId=googleLoginClientId();if(!clientId)return Response.json({error:'Google login unavailable'},{status:503,headers:authHeaders});
 try{const nonce=await beginGoogleLogin();return Response.json({clientId,nonce},{headers:{...authHeaders,'Set-Cookie':authCookie(loginCookie,nonce,600)}});}catch{return Response.json({error:'Login temporarily unavailable'},{status:503,headers:authHeaders});}
}
export async function POST(request:Request){
 if(!sameOriginAuth(request))return Response.json({error:'Origin mismatch'},{status:403,headers:authHeaders});
 const clientId=googleLoginClientId(),challenge=readAuthCookie(request.headers,loginCookie);
 if(!clientId||!challenge)return Response.json({error:'Restart login'},{status:401,headers:authHeaders});
 let body:Record<string,unknown>;try{body=await limitedJson(request);}catch{return Response.json({error:'Invalid request'},{status:400,headers:authHeaders});}
 if(body.nonce!==challenge||typeof body.credential!=='string')return Response.json({error:'Invalid login challenge'},{status:401,headers:authHeaders});
 let profile;try{profile=await verifyGoogleCredential(body.credential,clientId,challenge);}catch{return Response.json({error:'Google identity could not be verified'},{status:401,headers:authHeaders});}
 try{
  if(!await consumeGoogleChallenge(challenge))return Response.json({error:'Login challenge expired or already used'},{status:401,headers:authHeaders});
  const token=await createVisitorSession(profile,readAuthCookie(request.headers,sessionCookie));
  const headers=new Headers(authHeaders);headers.append('Set-Cookie',authCookie(sessionCookie,token,sessionSeconds));headers.append('Set-Cookie',authCookie(loginCookie,'',0));
  return Response.json({ok:true},{headers});
 }catch{return Response.json({error:'Could not complete login'},{status:503,headers:authHeaders});}
}
