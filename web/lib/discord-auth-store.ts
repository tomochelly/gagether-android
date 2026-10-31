import {env} from 'cloudflare:workers';
import {hashToken,randomToken,readAuthCookie,sessionCookie} from './google-login';
import {discordConfig,discordLoginCookie,accountReturnTo} from './discord-login';
import type {Locale} from './types';
export const discordLoginConfig=()=>discordConfig(env as unknown as Record<string,unknown>);
export async function beginDiscordLogin(headers:Headers,origin:string,locale:Locale,returnTo:string){
 const state=randomToken(),verifier=randomToken(),now=Date.now(),session=readAuthCookie(headers,sessionCookie),old=readAuthCookie(headers,discordLoginCookie);
 const statements=[env.DB!.prepare('DELETE FROM visitor_oauth_challenges WHERE expires_at<=?').bind(now)];
 if(old)statements.push(env.DB!.prepare('DELETE FROM visitor_oauth_challenges WHERE token_hash=?').bind(await hashToken(old)));
 statements.push(env.DB!.prepare('INSERT INTO visitor_oauth_challenges(token_hash,code_verifier,origin,locale,return_to,session_hash,expires_at) VALUES (?,?,?,?,?,?,?)').bind(await hashToken(state),verifier,origin,locale,accountReturnTo(returnTo),session?await hashToken(session):null,now+600000));
 await env.DB!.batch(statements);return {state,verifier};
}
export async function consumeDiscordLogin(headers:Headers,state:string,origin:string){
 const session=readAuthCookie(headers,sessionCookie);
 return env.DB!.prepare('DELETE FROM visitor_oauth_challenges WHERE token_hash=? AND origin=? AND session_hash IS ? AND expires_at>? RETURNING code_verifier,locale,return_to').bind(await hashToken(state),origin,session?await hashToken(session):null,Date.now()).first<{code_verifier:string;locale:Locale;return_to:string}>();
}
