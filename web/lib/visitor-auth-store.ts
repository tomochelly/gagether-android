import {env} from 'cloudflare:workers';
import {hashToken,randomToken,readAuthCookie,sessionCookie,sessionSeconds} from './google-login';
import type {VisitorIdentity,VisitorProvider,VisitorUser} from './visitor-identity';
export function googleLoginClientId(){const config=env as unknown as Record<string,unknown>;const value=config.GOOGLE_SIGN_IN_CLIENT_ID||config.GOOGLE_CALENDAR_CLIENT_ID;return typeof value==='string'&&/^[a-zA-Z0-9._-]+\.apps\.googleusercontent\.com$/.test(value)?value:null;}
export async function beginGoogleLogin(){
 const token=randomToken(),now=Date.now();
 await env.DB!.batch([
  env.DB!.prepare('DELETE FROM visitor_login_challenges WHERE expires_at<=?').bind(now),
  env.DB!.prepare('DELETE FROM visitor_sessions WHERE expires_at<=?').bind(now),
  env.DB!.prepare('INSERT INTO visitor_login_challenges(token_hash,expires_at) VALUES (?,?)').bind(await hashToken(token),now+600000)
 ]);
 return token;
}
export async function consumeGoogleChallenge(token:string){const r=await env.DB!.prepare('DELETE FROM visitor_login_challenges WHERE token_hash=? AND expires_at>?').bind(await hashToken(token),Date.now()).run();return r.meta.changes===1;}
export async function visitorSession(headers:Headers){
 const token=readAuthCookie(headers,sessionCookie);if(!token)return null;
 return env.DB!.prepare("SELECT a.id,a.name,a.email,a.provider FROM visitor_sessions s JOIN visitor_accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>? AND a.provider IN ('google','discord')").bind(await hashToken(token),Date.now()).first<VisitorUser&{id:string}>();
}
export async function createVisitorSession(profile:VisitorIdentity,previous:string|null,provider:VisitorProvider='google'){
 if(provider!=='google'&&provider!=='discord'||provider==='google'&&profile.subject.startsWith('discord:'))throw Error('Invalid identity provider');
 const token=randomToken(),now=Date.now(),accountId=await hashToken(provider+':'+profile.subject),identityKey=provider==='google'?profile.subject:'discord:'+profile.subject;
 const queries=[env.DB!.prepare('INSERT INTO visitor_accounts(id,google_subject,provider,name,email,created_at,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(google_subject) DO UPDATE SET name=excluded.name,email=excluded.email,updated_at=excluded.updated_at WHERE visitor_accounts.provider=excluded.provider').bind(accountId,identityKey,provider,profile.name,profile.email,now,now),env.DB!.prepare('INSERT INTO visitor_sessions(token_hash,account_id,expires_at) VALUES (?,?,?)').bind(await hashToken(token),accountId,now+sessionSeconds*1000)];
 if(previous)queries.push(env.DB!.prepare('DELETE FROM visitor_sessions WHERE token_hash=?').bind(await hashToken(previous)));
 await env.DB!.batch(queries);return token;
}
export async function deleteVisitorSession(headers:Headers){const token=readAuthCookie(headers,sessionCookie);if(token)await env.DB!.prepare('DELETE FROM visitor_sessions WHERE token_hash=?').bind(await hashToken(token)).run();}
export async function deleteVisitorAccount(headers:Headers){const account=await visitorSession(headers);if(account)await env.DB!.batch([env.DB!.prepare('DELETE FROM visitor_sessions WHERE account_id=?').bind(account.id),env.DB!.prepare('DELETE FROM visitor_accounts WHERE id=?').bind(account.id)]);}
