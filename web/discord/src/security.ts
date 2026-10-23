import type {Interaction} from './types';
export const actor=(interaction:Interaction)=>interaction.member?.user.id||interaction.user?.id||'';
export const snowflake=(id:unknown):id is string=>typeof id==='string'&&/^\d{15,22}$/.test(id);
export function canManage(interaction:Interaction){
  try{const bits=BigInt(interaction.member?.permissions||'0');return !!interaction.guild_id&&!!(bits&(BigInt(8)|BigInt(32)));}catch{return false;}
}
export function canPost(bits:string|undefined){
  try{const value=BigInt(bits||'0'),needed=BigInt(1024)|BigInt(2048)|BigInt(16384);return !!(value&BigInt(8))||(value&needed)===needed;}catch{return false;}
}
export const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
export async function hash(value:string){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));}
export async function verifySignature(body:string,signature:string|null,timestamp:string|null,publicKey:string,now=Date.now()){
  if(!signature||!timestamp||!/^\d{10}$/.test(timestamp)||!/^[a-f\d]{128}$/i.test(signature)||!/^[a-f\d]{64}$/i.test(publicKey))return false;
  if(Math.abs(now-Number(timestamp)*1000)>300000)return false;
  const bytes=(s:string)=>Uint8Array.from(s.match(/../g)!,v=>parseInt(v,16));
  try{
    const key=await crypto.subtle.importKey('raw',bytes(publicKey),{name:'Ed25519'},false,['verify']);
    return await crypto.subtle.verify('Ed25519',key,bytes(signature),new TextEncoder().encode(timestamp+body));
  }catch{return false;}
}
export function safeUrl(value:string|undefined,origin:string){
  if(!value)return undefined;
  try{const u=new URL(value,origin);return u.protocol==='https:'&&!u.username&&!u.password&&u.href.length<2000?u.href:undefined;}catch{return undefined;}
}
export function siteOrigin(value:string){
  const u=new URL(value);
  if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('Invalid GAGETHER_ORIGIN');
  return u.origin;
}
export const escapeText=(value:string,max=1000)=>value.replace(/@/g,'＠').replace(/([\\`*_~|>\[\]])/g,'\\$1').slice(0,max);
