import {authCookie,authHeaders,readAuthCookie,sessionCookie,sessionSeconds} from '@/lib/google-login';
import {accountReturnTo,discordLoginCookie,exchangeDiscordIdentity,discordFailureDetails} from '@/lib/discord-login';
import {consumeDiscordLogin,discordLoginConfig} from '@/lib/discord-auth-store';
import {createVisitorSession} from '@/lib/visitor-auth-store';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const url=new URL(request.url),state=url.searchParams.get('state'),cookie=readAuthCookie(request.headers,discordLoginCookie),config=discordLoginConfig();
 const result=new URL('/account',url.origin),headers=new Headers({...authHeaders,'Referrer-Policy':'no-referrer'});
 headers.append('Set-Cookie',authCookie(discordLoginCookie,'',0));
 const finish=(error?:string)=>{if(error)result.searchParams.set('discord',error);headers.set('Location',result.href);return new Response(null,{status:303,headers});};
 if(!config||new URL(config.redirectUri).origin!==url.origin)return finish('unavailable');
 if(!cookie||state!==cookie||!state||!/^[a-f0-9]{64}$/.test(state)||url.searchParams.get('iss')!=='https://discord.com'||['state','iss','code','error'].some(key=>url.searchParams.getAll(key).length>1))return finish('restart');
 let stage:'challenge'|'exchange'|'session'='challenge';
 try{
  const challenge=await consumeDiscordLogin(request.headers,state,url.origin);if(!challenge)return finish('restart');
  result.searchParams.set('locale',challenge.locale);const back=accountReturnTo(challenge.return_to);if(back!=='/')result.searchParams.set('returnTo',back);
  if(url.searchParams.get('error'))return finish(url.searchParams.get('error')==='access_denied'?'cancelled':'failed');
  const code=url.searchParams.get('code');if(!code||code.length>2048||/[\u0000-\u0020\u007f]/.test(code))return finish('restart');
  stage='exchange';const profile=await exchangeDiscordIdentity(config,code,challenge.code_verifier);
  stage='session';
  const token=await createVisitorSession(profile,readAuthCookie(request.headers,sessionCookie),'discord');
  headers.append('Set-Cookie',authCookie(sessionCookie,token,sessionSeconds));return finish();
 }catch(error){console.error('Discord sign-in failed',JSON.stringify(discordFailureDetails(error,stage)));return finish('failed');}
}
