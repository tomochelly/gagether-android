import {env} from 'cloudflare:workers';
import {discordClientConfig,discordConfig,discordCallbackPath} from './discord-login';
import {decodeEnvelopeBase64,handoffLifetimeMs,type DiscordHandoffConfig,type DiscordHandoffStatus} from './secret-handoff';
const id='discord-sign-in';
type Row={client_id:string;key_id:string;ciphertext:string|null;revision:number;expires_at:number};
export function discordHandoffConfig():DiscordHandoffConfig|null{
 const values=env as unknown as Record<string,unknown>,client=discordClientConfig(values),publicKey=values.DISCORD_SETUP_PUBLIC_KEY,keyId=values.DISCORD_SETUP_KEY_ID;
 if(!client||typeof publicKey!=='string'||typeof keyId!=='string'||!/^[a-f0-9]{64}$/.test(keyId))return null;
 try{const bytes=decodeEnvelopeBase64(publicKey);if(bytes.length<512||bytes.length>1024)return null;}catch{return null;}
 return {...client,publicKey,keyId};
}
export async function discordHandoffStatus():Promise<DiscordHandoffStatus>{
 const values=env as unknown as Record<string,unknown>,client=discordClientConfig(values),config=discordHandoffConfig(),configured=!!discordConfig(values),now=Date.now();
 // Only expire this bounded encrypted handoff. No editorial or account data is used.
 await env.DB!.prepare('UPDATE owner_secret_handoffs SET ciphertext=NULL,expires_at=0,revision=revision+1 WHERE id=? AND ciphertext IS NOT NULL AND (expires_at<=? OR (?=1 AND client_id=?))').bind(id,now,configured?1:0,client?.clientId||'').run();
 const row=await env.DB!.prepare('SELECT client_id,key_id,ciphertext,revision,expires_at FROM owner_secret_handoffs WHERE id=?').bind(id).first<Row>();
 const pending=!!(config&&row?.ciphertext&&row.client_id===config.clientId&&row.key_id===config.keyId&&row.expires_at>now);
 return {clientId:client?.clientId||null,redirectUri:client?.redirectUri||'https://gagether.wiki'+discordCallbackPath,keyId:config?.keyId||null,publicKey:config?.publicKey||null,ready:!!config&&!configured,configured,revision:row?.revision||0,pending,expiresAt:pending?row!.expires_at:null};
}
export async function saveDiscordHandoff(body:Record<string,unknown>){
 const config=discordHandoffConfig();if(!config||discordConfig(env as unknown as Record<string,unknown>))return {status:409,error:'Setup is not accepting a secret'};
 if(Object.keys(body).some(k=>!['clientId','keyId','ciphertext','revision'].includes(k))||body.clientId!==config.clientId||body.keyId!==config.keyId||typeof body.ciphertext!=='string'||body.ciphertext.length!==684||!Number.isSafeInteger(body.revision)||(body.revision as number)<0)return {status:400,error:'Invalid encrypted setup'};
 try{if(decodeEnvelopeBase64(body.ciphertext).length!==512)return {status:400,error:'Invalid encrypted setup'};}catch{return {status:400,error:'Invalid encrypted setup'};}
 const now=Date.now(),result=body.revision===0
  ?await env.DB!.prepare('INSERT INTO owner_secret_handoffs(id,client_id,key_id,ciphertext,revision,updated_at,expires_at) VALUES (?,?,?,?,1,?,?) ON CONFLICT(id) DO NOTHING').bind(id,config.clientId,config.keyId,body.ciphertext,now,now+handoffLifetimeMs).run()
  :await env.DB!.prepare('UPDATE owner_secret_handoffs SET client_id=?,key_id=?,ciphertext=?,revision=revision+1,updated_at=?,expires_at=? WHERE id=? AND revision=?').bind(config.clientId,config.keyId,body.ciphertext,now,now+handoffLifetimeMs,id,body.revision).run();
 return result.meta.changes===1?{status:200,ok:true}:{status:409,error:'Setup changed; reload before retrying'};
}
