import {authHeaders,authCookie,sessionCookie,sameOriginAuth,limitedJson} from '@/lib/google-login';
import {visitorSession,deleteVisitorSession,deleteVisitorAccount} from '@/lib/visitor-auth-store';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const user=await visitorSession(request.headers);return Response.json({user:user?{name:user.name,email:user.email,provider:user.provider}:null},{headers:authHeaders});}catch{return Response.json({error:'Session unavailable'},{status:503,headers:authHeaders});}}
export async function POST(request:Request){
 if(!sameOriginAuth(request))return Response.json({error:'Origin mismatch'},{status:403,headers:authHeaders});
 try{const body=await limitedJson(request);if(body.action!=='logout'&&body.action!=='delete-account')return Response.json({error:'Invalid action'},{status:400,headers:authHeaders});
 if(body.action==='delete-account')await deleteVisitorAccount(request.headers);else await deleteVisitorSession(request.headers);
 return Response.json({ok:true},{headers:{...authHeaders,'Set-Cookie':authCookie(sessionCookie,'',0)}});
 }catch{return Response.json({error:'Could not update session'},{status:503,headers:authHeaders});}
}
