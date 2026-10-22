// A narrowly scoped GitHub Actions identity; no persistent Site credential in CI.
const issuer='https://token.actions.githubusercontent.com';
export const refreshAudience='https://gagether.wiki/api/fast-refresh';
export const refreshWorkflow='tomochelly/gagether-android/.github/workflows/gagether-refresh.yml@refs/heads/main';
let cache:{until:number;keys:JsonWebKey[]}|undefined;
const bytes=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export async function verifyRefreshIdentity(token:string,fetcher:typeof fetch=fetch,now=Date.now()):Promise<boolean>{
 return !!await githubIdentity(token,refreshAudience,refreshWorkflow,fetcher,now);
}
export async function githubIdentity(token:string,audience:string,workflow:string,fetcher:typeof fetch=fetch,now=Date.now()):Promise<{sha:string;actor:string;run_id:string}|null>{
 try{
  if(token.length>16000)return null;
  const parts=token.split('.');if(parts.length!==3)return null;
  const h=JSON.parse(new TextDecoder().decode(bytes(parts[0]))),c=JSON.parse(new TextDecoder().decode(bytes(parts[1])));
  if(h.alg!=='RS256'||typeof h.kid!=='string'||h.typ!=='JWT')return null;
  if(c.iss!==issuer||c.aud!==audience||c.repository_id!=='1422741334'||c.repository_owner_id!=='343730239'||c.repository!=='tomochelly/gagether-android'||c.ref!=='refs/heads/main'||c.workflow_ref!==workflow||!['schedule','workflow_dispatch','push'].includes(c.event_name))return null;
  if(typeof c.exp!=='number'||typeof c.nbf!=='number'||typeof c.iat!=='number'||c.exp<=now/1000||c.nbf>now/1000+30||c.iat>now/1000+30||now/1000-c.iat>600||c.exp-c.iat>900)return null;
  if(!cache||cache.until<now){
   const r=await fetcher(issuer+'/.well-known/jwks',{signal:AbortSignal.timeout(10000),redirect:'manual'});if(!r.ok)return null;
   const j=await r.json() as {keys:JsonWebKey[]};if(!Array.isArray(j.keys)||j.keys.length>20)return null;cache={until:now+300000,keys:j.keys};
  }
  const jwk=cache.keys.find(k=>(k as JsonWebKey&{kid?:string}).kid===h.kid&&k.kty==='RSA');if(!jwk)return null;
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))return null;
  return {sha:c.sha,actor:c.actor,run_id:c.run_id};
 }catch{return null;}
}
