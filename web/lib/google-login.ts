import {createRemoteJWKSet,jwtVerify,type JWTVerifyGetKey} from 'jose';
const googleKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'),{timeoutDuration:5000,cooldownDuration:30000,cacheMaxAge:3600000});
export const loginCookie='__Host-gagether-login';
export const sessionCookie='__Host-gagether-session';
export const sessionSeconds=30*24*60*60;
export const authHeaders={'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
export type GoogleProfile={subject:string;name:string;email:string};
export function randomToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');}
export async function hashToken(token:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');}
export function readAuthCookie(headers:Headers,name:string){const value=(headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1);return value&&/^[a-f0-9]{64}$/.test(value)?value:null;}
export function authCookie(name:string,value:string,maxAge:number){return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;}
export function sameOriginAuth(request:Request){
 if(request.headers.get('x-gagether-auth')!=='1'||request.headers.get('sec-fetch-site')==='cross-site')return false;
 const origin=request.headers.get('origin');
 return origin===new URL(request.url).origin;
}
export async function verifyGoogleCredential(credential:string,clientId:string,nonce:string,key:JWTVerifyGetKey=googleKeys):Promise<GoogleProfile>{
 const {payload}=await jwtVerify(credential,key,{algorithms:['RS256'],issuer:['https://accounts.google.com','accounts.google.com'],audience:clientId,requiredClaims:['sub','exp','iat','nonce','email'],maxTokenAge:'10m',clockTolerance:30});
 if(payload.nonce!==nonce||typeof payload.sub!=='string'||!payload.sub||payload.sub.length>255||payload.email_verified!==true||typeof payload.email!=='string'||payload.email.length>320||payload.azp&&payload.azp!==clientId)throw Error('Invalid Google identity');
 // Google sub, never email, is the account key. This cannot grant owner access.
 return {subject:payload.sub,email:payload.email,name:typeof payload.name==='string'?payload.name.slice(0,200):payload.email};
}
export async function limitedJson(request:Request){
 const reader=request.body?.getReader();if(!reader)throw Error('Missing body');
 let size=0,text='';const decoder=new TextDecoder();
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>16384){await reader.cancel();throw Error('Body too large');}text+=decoder.decode(part.value,{stream:true});}
 return JSON.parse(text+decoder.decode()) as Record<string,unknown>;
}
