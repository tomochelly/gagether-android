import {importPKCS8,SignJWT} from 'jose';
import configuration from '../content/android-push.json' with {type:'json'};
import {pushAudience,type PushDraft,pushReadiness} from './owner-push';
export type PushEnvironment={GAGETHER_FCM_SERVICE_ACCOUNT?:string;GAGETHER_FCM_APP_READY?:string};
type Credentials={project_id:string;client_email:string;private_key:string;private_key_id?:string};
type CachedToken={key:string;value:string;until:number};
let cached:CachedToken|undefined;
let pending:{key:string;promise:Promise<string>}|undefined;
function credentials(env:PushEnvironment):Credentials|null{
 try{const c=JSON.parse(env.GAGETHER_FCM_SERVICE_ACCOUNT||'null');return c&&c.type==='service_account'&&c.project_id===configuration.projectId&&typeof c.client_email==='string'&&/^[a-z0-9-]+@gagether-a44a6\.iam\.gserviceaccount\.com$/.test(c.client_email)&&typeof c.private_key==='string'&&c.private_key.length<12000&&/^-----BEGIN PRIVATE KEY-----\r?\n/.test(c.private_key)?c:null;}catch{return null;}
}
export function fcmReadiness(env:PushEnvironment){const configured=!!credentials(env),appReady=env.GAGETHER_FCM_APP_READY==='1';return {...pushReadiness,ready:configured&&appReady,serverConfigured:configured,appReady,reason:!configured?'Firebase 앱 등록 완료 · 서버 발송 권한 연결이 필요해요.':!appReady?'서버 설정 완료 · 기존 서명으로 만든 새 앱에서 실제 수신을 확인한 뒤 발송을 켜세요.':'게임·언어·내용을 확인한 뒤 발송할 수 있어요.'};}
async function token(c:Credentials){
 const key=c.client_email+':'+(c.private_key_id||c.private_key.slice(-100));if(cached?.key===key&&cached.until>Date.now())return cached.value;
 if(pending?.key===key)return pending.promise;
 const promise=(async()=>{const signingKey=await importPKCS8(c.private_key,'RS256'),jwt=await new SignJWT({scope:'https://www.googleapis.com/auth/firebase.messaging'}).setProtectedHeader({alg:'RS256',typ:'JWT',...(c.private_key_id?{kid:c.private_key_id}:{})}).setIssuer(c.client_email).setSubject(c.client_email).setAudience('https://oauth2.googleapis.com/token').setIssuedAt().setExpirationTime('5m').sign(signingKey);
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt}),signal:AbortSignal.timeout(12000)});
 if(response.status>=300&&response.status<400)throw new FcmError('authorization-redirect',true);
 const b=await response.json() as any;if(!response.ok||typeof b.access_token!=='string'||!b.access_token||b.access_token.length>10000)throw new FcmError('authorization',true);cached={key,value:b.access_token,until:Date.now()+Math.max(0,Math.min(Number(b.expires_in)||300,3600)-60)*1000};return b.access_token;})();pending={key,promise};try{return await promise;}finally{if(pending?.promise===promise)pending=undefined;}
}
export class FcmError extends Error{constructor(public code:string,public definite:boolean){super(code);}}
export async function sendFcm(env:PushEnvironment,d:Pick<PushDraft,'gameId'|'locale'|'title'|'body'>,id:string,validateOnly=false,now=Date.now()){
 const c=credentials(env);if(!c)throw new FcmError('not-configured',true);
 let access:string;try{access=await token(c);}catch(e){throw e instanceof FcmError?e:new FcmError('authorization-unavailable',true);}
 const audience=pushAudience(d.gameId,d.locale),message={topic:audience.topic,data:{schema:'1',id,game_id:d.gameId,locale:d.locale,title:d.title,body:d.body,path:audience.path,sent_at:String(now),expires_at:String(now+3600000)},android:{priority:'HIGH',ttl:'3600s',restricted_package_name:configuration.applicationId}};
 let response:Response;try{response=await fetch(`https://fcm.googleapis.com/v1/projects/${configuration.projectId}/messages:send`,{method:'POST',redirect:'manual',headers:{Authorization:'Bearer '+access,'Content-Type':'application/json'},body:JSON.stringify({validate_only:validateOnly,message}),signal:AbortSignal.timeout(15000)});}catch{throw new FcmError('acceptance-unknown',false);}
 if(response.status>=300&&response.status<400)throw new FcmError('provider-redirect',true);
 let b:any;try{b=await response.json();}catch{throw new FcmError('acceptance-unknown',false);}
 if(!response.ok){const code=String(b?.error?.status||'provider-rejected');if(response.status===401)cached=undefined;throw new FcmError(/^[A-Z_]{1,60}$/.test(code)?code:'provider-rejected',response.status>=400&&response.status<500);}
 if(validateOnly)return {validated:true as const};
 if(typeof b.name!=='string'||!b.name.startsWith('projects/'+configuration.projectId+'/messages/')||b.name.length>300)throw new FcmError('acceptance-unknown',false);
 return {providerMessageId:b.name};
}
