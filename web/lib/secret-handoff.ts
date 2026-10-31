// Browser-safe public-key envelope utilities. No private key is hosted by the Site.
export const handoffLifetimeMs=60*60*1000;
export const discordSecretPattern=/^[!-~]{16,256}$/;
export const handoffLabel=(clientId:string,keyId:string)=>new TextEncoder().encode('gagether:discord-sign-in:'+clientId+':'+keyId);
export function decodeEnvelopeBase64(value:string){
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(value)||value.length%4!==0)throw Error('Invalid envelope');
 return Uint8Array.from(atob(value),v=>v.charCodeAt(0));
}
export const encodeEnvelopeBase64=(value:Uint8Array)=>btoa(String.fromCharCode(...value));
export type DiscordHandoffConfig={clientId:string;redirectUri:string;publicKey:string;keyId:string};
export type DiscordHandoffStatus={clientId:string|null;redirectUri:string;keyId:string|null;publicKey:string|null;ready:boolean;configured:boolean;revision:number;pending:boolean;expiresAt:number|null};
export async function encryptDiscordSecret(secret:string,config:DiscordHandoffConfig){
 if(!discordSecretPattern.test(secret)||!/^\d{17,20}$/.test(config.clientId)||!/^[a-f0-9]{64}$/.test(config.keyId))throw Error('Invalid secret setup');
 const spki=decodeEnvelopeBase64(config.publicKey),digest=await crypto.subtle.digest('SHA-256',spki),keyId=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
 if(keyId!==config.keyId)throw Error('Setup key changed');
 const key=await crypto.subtle.importKey('spki',spki,{name:'RSA-OAEP',hash:'SHA-256'},false,['encrypt']);
 if((key.algorithm as RsaHashedKeyAlgorithm).modulusLength!==4096)throw Error('Invalid setup key');
 const plaintext=new TextEncoder().encode(secret);
 try{return encodeEnvelopeBase64(new Uint8Array(await crypto.subtle.encrypt({name:'RSA-OAEP',label:handoffLabel(config.clientId,config.keyId)},key,plaintext)));}finally{plaintext.fill(0);}
}
