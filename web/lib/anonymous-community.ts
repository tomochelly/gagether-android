import {env} from 'cloudflare:workers';
import {visitorSession} from './visitor-auth-store';
import {authCookie,hashToken,randomToken,readAuthCookie,sessionSeconds} from './google-login';
export const anonymousCookie='__Host-gagether-anonymous';
/** Only the edge-supplied address is used. Neither the full address nor forwarding headers are published. */
export function maskedCommunityIp(headers:Headers):string|null{
 const address=headers.get('cf-connecting-ip')?.trim()||'';
 const ipv4=(value:string)=>{const parts=value.split('.');return parts.length===4&&parts.every(p=>/^\d{1,3}$/.test(p)&&Number(p)<=255)?parts.slice(0,2).map(Number).join('.'):null;};
 if(!address.includes(':'))return ipv4(address);
 if(/^::ffff:/i.test(address)&&address.includes('.'))return ipv4(address.slice(7));
 try{const normalized=new URL('http://['+address+']/').hostname.slice(1,-1),halves=normalized.split('::');if(halves.length>2)return null;const left=halves[0]?halves[0].split(':'):[],right=halves[1]?halves[1].split(':'):[],full=halves.length===2?[...left,...Array(8-left.length-right.length).fill('0'),...right]:left;return full.length===8?full.slice(0,2).map(v=>parseInt(v,16).toString(16)).join(':'):null;}catch{return null;}
}
export type CommunityActor={id:string;scope:string;anonymous:boolean;signedIn:boolean;ipPrefix:string|null;cookie?:string};
export async function communityActor(request:Request,anonymous=false,issue=false):Promise<CommunityActor|null>{
 const user=await visitorSession(request.headers);
 if(user&&!anonymous)return {id:user.id,scope:(await hashToken('forum-draft:'+user.id)).slice(0,24),anonymous:false,signedIn:true,ipPrefix:null};
 let token=readAuthCookie(request.headers,anonymousCookie),cookie:string|undefined;
 if(!token&&issue){token=randomToken();cookie=authCookie(anonymousCookie,token,sessionSeconds);}
 if(!token)return null;
 const id=await hashToken('anonymous-community:'+token);
 return {id,scope:(await hashToken('forum-draft:'+id)).slice(0,24),anonymous:true,signedIn:!!user,ipPrefix:maskedCommunityIp(request.headers),cookie};
}
/** A guest actor is not a login session and cannot read account sync, presets or other private account data. */
export async function registerAnonymousActor(actor:CommunityActor){
 if(!actor.anonymous)return;
 const now=Date.now();await env.DB!.prepare("INSERT INTO visitor_accounts(id,google_subject,provider,name,email,created_at,updated_at) VALUES (?,?,'anonymous','Anonymous','',?,?) ON CONFLICT(id) DO NOTHING").bind(actor.id,'anonymous:'+actor.id,now,now).run();
}
export async function anonymousNetworkKey(request:Request){
 const ip=request.headers.get('cf-connecting-ip')||'';return maskedCommunityIp(request.headers)?hashToken('anonymous-community-rate:'+ip):null;
}
