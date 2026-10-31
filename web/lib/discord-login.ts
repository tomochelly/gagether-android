import {hashToken} from './google-login';
import type {VisitorIdentity} from './visitor-identity';
export const discordLoginCookie='__Host-gagether-discord';
export const discordCallbackPath='/api/auth/discord/callback';
export type DiscordLoginConfig={clientId:string;clientSecret:string;redirectUri:string};
export function discordClientConfig(values:Record<string,unknown>){
 const clientId=values.DISCORD_SIGN_IN_CLIENT_ID;
 if(typeof clientId!=='string'||!/^\d{17,20}$/.test(clientId))return null;
 try{const url=new URL(typeof values.DISCORD_SIGN_IN_REDIRECT_URI==='string'?values.DISCORD_SIGN_IN_REDIRECT_URI:'https://gagether.wiki'+discordCallbackPath);
  if(url.protocol!=='https:'||url.pathname!==discordCallbackPath||url.search||url.hash||url.username||url.password)return null;
  return {clientId,redirectUri:url.href};
 }catch{return null;}
}
export function discordConfig(values:Record<string,unknown>):DiscordLoginConfig|null{
 const client=discordClientConfig(values),clientSecret=values.DISCORD_SIGN_IN_CLIENT_SECRET;
 return client&&typeof clientSecret==='string'&&/^[!-~]{16,256}$/.test(clientSecret)?{...client,clientSecret}:null;
}
export function accountReturnTo(value:unknown){
 if(value==='/mobile')return value;
 if(typeof value!=='string'||value.length>400)return '/';
 if(/^\/\?entry=[a-zA-Z0-9_%.-]+$/.test(value))return value;
 // Orbit shares identity, but must return to its own local namespace.
 if(/^\/orbit\/(?:ko|en|ja|zh)(?:\?(?:(?:game|section|tab|region)=[a-z0-9-]+)(?:&(?:game|section|tab|region)=[a-z0-9-]+)*)?$/.test(value))return value;
 // Only the new local board/detail paths may return from visitor sign-in.
 if(/^\/(?:ko|en|ja|zh)\/community(?:\/[a-f0-9-]{36})?(?:\?game=[a-z0-9-]+)?$/.test(value))return value;
 return '/';
}
export async function pkceChallenge(verifier:string){const hex=await hashToken(verifier);return btoa(String.fromCharCode(...hex.match(/../g)!.map(v=>parseInt(v,16)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export async function discordAuthorizeUrl(config:DiscordLoginConfig,state:string,verifier:string){
 const url=new URL('https://discord.com/oauth2/authorize');
 url.search=new URLSearchParams({response_type:'code',client_id:config.clientId,redirect_uri:config.redirectUri,scope:'identify',state,code_challenge:await pkceChallenge(verifier),code_challenge_method:'S256'}).toString();
 return url.href;
}
type DiscordStage='token'|'profile';
type DiscordFailureReason='http'|'transport'|'format'|'size'|'token-shape'|'identity';
const oauthErrors=new Set(['invalid_request','invalid_client','invalid_grant','unauthorized_client','unsupported_grant_type','invalid_scope','access_denied','server_error','temporarily_unavailable']);
const discordHeaders={'User-Agent':'DiscordBot (https://gagether.wiki, 1.0)','Accept':'application/json'};
export class DiscordOAuthFailure extends Error{
 constructor(readonly stage:DiscordStage,readonly reason:DiscordFailureReason,readonly status?:number,readonly providerError?:string,readonly providerCode?:number){super('Discord identity verification failed');}
}
export function discordFailureDetails(error:unknown,stage:'challenge'|'exchange'|'session'){
 if(!(error instanceof DiscordOAuthFailure))return {stage,reason:'internal'};
 const providerCode=typeof error.providerCode==='number'&&Number.isSafeInteger(error.providerCode)&&error.providerCode>=0&&error.providerCode<=100000?error.providerCode:undefined;
 return {stage:error.stage,reason:error.reason,httpStatus:error.status,providerError:error.providerError&&oauthErrors.has(error.providerError)?error.providerError:undefined,providerCode};
}
async function responseJson(response:Response,stage:DiscordStage){
 const json=response.headers.get('content-type')?.toLowerCase().includes('application/json');
 if(!json)throw new DiscordOAuthFailure(stage,response.ok?'format':'http',response.status);
 const reader=response.body?.getReader();if(!reader)throw new DiscordOAuthFailure(stage,'format',response.status);
 let text='',bytes=0;const decoder=new TextDecoder();
 while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>32768){await reader.cancel();throw new DiscordOAuthFailure(stage,'size',response.status);}text+=decoder.decode(part.value,{stream:true});}
 let value;try{value=JSON.parse(text+decoder.decode());}catch{throw new DiscordOAuthFailure(stage,'format',response.status);}
 if(!value||typeof value!=='object'||Array.isArray(value))throw new DiscordOAuthFailure(stage,'format',response.status);
 if(!response.ok)throw new DiscordOAuthFailure(stage,'http',response.status,typeof value.error==='string'&&oauthErrors.has(value.error)?value.error:undefined,typeof value.code==='number'?value.code:undefined);
 return value as Record<string,unknown>;
}
async function discordJson(fetcher:typeof fetch,url:string,options:RequestInit,stage:DiscordStage){
 try{return await responseJson(await fetcher(url,options),stage);}catch(error){if(error instanceof DiscordOAuthFailure)throw error;throw new DiscordOAuthFailure(stage,'transport');}
}
// No browser token, refresh-token storage, email, guild, message or bot scope.
export async function exchangeDiscordIdentity(config:DiscordLoginConfig,code:string,verifier:string,fetcher:typeof fetch=fetch):Promise<VisitorIdentity>{
 let accessToken:string|undefined;
 try{
  const token=await discordJson(fetcher,'https://discord.com/api/oauth2/token',{method:'POST',headers:{...discordHeaders,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:config.clientId,client_secret:config.clientSecret,grant_type:'authorization_code',code,redirect_uri:config.redirectUri,code_verifier:verifier}),redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(8000)},'token');
  // OAuth token types are case-insensitive; omitted scope retains the scope we requested.
  if(typeof token.token_type!=='string'||token.token_type.toLowerCase()!=='bearer'||typeof token.access_token!=='string'||!token.access_token||token.access_token.length>4096||/[\r\n]/.test(token.access_token)||token.scope!==undefined&&(typeof token.scope!=='string'||!token.scope.split(/\s+/).includes('identify')))throw new DiscordOAuthFailure('token','token-shape');
  accessToken=token.access_token;
  const user=await discordJson(fetcher,'https://discord.com/api/v10/users/@me',{headers:{...discordHeaders,Authorization:'Bearer '+accessToken},redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(8000)},'profile');
  if(typeof user.id!=='string'||!/^\d{17,20}$/.test(user.id)||BigInt(user.id)>BigInt('18446744073709551615')||BigInt(user.id)===BigInt(0)||typeof user.username!=='string'||!user.username.trim()||user.username.length>100||user.bot===true||user.system===true)throw new DiscordOAuthFailure('profile','identity');
  const clean=(name:string)=>name.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,200),name=(typeof user.global_name==='string'?clean(user.global_name):'')||clean(user.username);
  if(!name)throw new DiscordOAuthFailure('profile','identity');return {subject:user.id,name,email:''};
 }finally{
  // The provider token is only needed to verify identity. Our opaque Site session
  // remains independent of it; discard and revoke the disposable OAuth grant.
  if(accessToken)try{await fetcher('https://discord.com/api/oauth2/token/revoke',{method:'POST',headers:{...discordHeaders,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:config.clientId,client_secret:config.clientSecret,token:accessToken,token_type_hint:'access_token'}),redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(2000)});}catch{}
 }
}
