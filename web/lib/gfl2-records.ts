import type {Localized} from './types';
import {uuid,recordVideoLink} from './wuwa-records';
export {uuid,recordVideoLink};
export type Gfl2GearStat={name:string;value:number;unit:'%'|'flat'};
export type Gfl2Setup={id:string;revision:number;name:string;characterId:string;level:number;chain:number;weaponId:string;weaponLevel:number;weaponRank:number;keys:string[];attachments:{slot:string;setId:string;stats:Gfl2GearStat[]}[];notes:string};
export type Gfl2Key={id:string;name:Localized;icon?:string;type?:string;slot?:number|null;description?:Localized;sourceUrl?:string;localization?:string};
export type Gfl2Catalog={checkedAt:string;characters:{id:string;name:Localized;icon:string;artwork:string;weaponType:string;keys:Gfl2Key[]}[];weapons:{id:string;name:Localized;icon:string;weaponType:string;description?:Localized}[];sets:{id:string;name:Localized;icon?:string;description?:Localized}[];modes:{id:string;name:Localized;description:Localized;capacity:number;ownCapacity:number;support:boolean;sourceUrl:string}[];cycles:{id:string;modeId:string;name:Localized;startDate:string;endDate:string;startAt?:string;endAt?:string;sourceUrl:string}[];sources:{url:string;label:string}[];localization?:{note:Localized}};
export type Gfl2Record={id:string;revision:number;modeId:string;cycleId:string;stageId:string;playedAt:string;party:(Gfl2Setup&{borrowed:boolean})[];turns:number|null;score:number|null;durationMs:number|null;playStyle:'manual'|'auto'|'mixed';videoUrl:string;videoStartSeconds:number;notes:string;author:string;verified:boolean;createdAt:number;state?:string};
const int=(v:unknown,a:number,b:number)=>Number.isSafeInteger(v)&&Number(v)>=a&&Number(v)<=b;
const text=(v:unknown,n:number)=>typeof v==='string'&&v.length<=n&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v);
const exact=(v:unknown,keys:string[]):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k));
export const gfl2Name=(rows:{id:string;name:Localized}[],id:string,l:keyof Localized)=>rows.find(v=>v.id===id)?.name[l]||id;
export function gfl2Keys(c:Gfl2Catalog,characterId:string){const own=c.characters.find(a=>a.id===characterId)?.keys||[];return [...own.filter(k=>(k as any).type!=='common'),...c.characters.flatMap(a=>a.keys.filter(k=>(k as any).type==='common'))];}
export function validGfl2Setup(v:unknown,c:Gfl2Catalog):v is Gfl2Setup{
 if(!exact(v,['id','revision','name','characterId','level','chain','weaponId','weaponLevel','weaponRank','keys','attachments','notes']))return false;
 const a=c.characters.find(x=>x.id===v.characterId),w=c.weapons.find(x=>x.id===v.weaponId);
 if(!uuid(v.id)||!int(v.revision,0,1000000)||!text(v.name,80)||!v.name.trim()||!a||!w||w.weaponType!==a.weaponType||!int(v.level,1,60)||!int(v.chain,0,6)||!int(v.weaponLevel,1,60)||!int(v.weaponRank,1,6)||!text(v.notes,1500))return false;
 const keys=gfl2Keys(c,a.id);if(!Array.isArray(v.keys)||v.keys.length>20||new Set(v.keys).size!==v.keys.length||!v.keys.every((id:unknown)=>typeof id==='string'&&keys.some(k=>k.id===id)))return false;
 for(const [type,max]of [['fixed',3],['common',3],['expansion',1]] as const)if(v.keys.filter((id:string)=>(keys.find(k=>k.id===id) as any)?.type===type).length>max)return false;
 if(!Array.isArray(v.attachments)||v.attachments.length>4||new Set(v.attachments.map((a:any)=>a.slot)).size!==v.attachments.length)return false;
 return v.attachments.every((a:unknown)=>exact(a,['slot','setId','stats'])&&['1','2','3','4'].includes(a.slot)&&(!a.setId||c.sets.some(s=>s.id===a.setId))&&Array.isArray(a.stats)&&a.stats.length<=6&&a.stats.every((s:unknown)=>exact(s,['name','value','unit'])&&text(s.name,50)&&s.name.trim()&&typeof s.value==='number'&&Number.isFinite(s.value)&&s.value>=0&&s.value<=1000000&&['%','flat'].includes(s.unit)));
}
export function blankGfl2Setup(c:Gfl2Catalog):Gfl2Setup{const a=c.characters.find(a=>c.weapons.some(w=>w.weaponType===a.weaponType))||c.characters[0];return{id:crypto.randomUUID(),revision:0,name:'',characterId:a?.id||'',level:60,chain:0,weaponId:c.weapons.find(w=>w.weaponType===a?.weaponType)?.id||'',weaponLevel:60,weaponRank:1,keys:[],attachments:[],notes:''};}
export function dateOnly(s:unknown):s is string{return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
/** An undated mode groups by the player-supplied challenge date, never a fabricated official season. */
export function validGfl2Submission(v:unknown,c:Gfl2Catalog,today:string){
 if(!exact(v,['action','accountScope','id','modeId','cycleId','stageId','playedAt','members','turns','score','durationMs','playStyle','videoUrl','videoStartSeconds','notes','publish']))return false;
 const m=c.modes.find(m=>m.id===v.modeId),cycle=c.cycles.find(p=>p.id===v.cycleId&&p.modeId===v.modeId);
 if(!uuid(v.id)||!m||!dateOnly(v.playedAt)||v.playedAt>today||!text(v.stageId,80)||!v.stageId.trim()||!text(v.cycleId,50)||(!cycle&&v.cycleId!=='date:'+v.playedAt)||cycle&&(v.playedAt<cycle.startDate||v.playedAt>cycle.endDate))return false;
 if(!Array.isArray(v.members)||v.members.length<1||v.members.length>m.capacity||!v.members.every((a:unknown)=>exact(a,['setupId','borrowed'])&&uuid(a.setupId)&&typeof a.borrowed==='boolean')||new Set(v.members.map((a:any)=>a.setupId)).size!==v.members.length||v.members.filter((a:any)=>a.borrowed).length>(m.support?1:0)||v.members.filter((a:any)=>!a.borrowed).length>m.ownCapacity)return false;
 if(!['manual','auto','mixed'].includes(v.playStyle)||v.turns!==null&&!int(v.turns,1,10000)||v.score!==null&&!int(v.score,0,1000000000)||v.durationMs!==null&&!int(v.durationMs,1,86400000)||v.turns===null&&v.score===null&&v.durationMs===null||!text(v.notes,3000)||v.publish!==true)return false;
 return recordVideoLink(v.videoUrl,v.videoStartSeconds)!==null;
}
