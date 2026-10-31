import type {Localized} from './types';
import {uuid,videoLink,recordVideoLink} from './wuwa-records';
export {uuid,videoLink,recordVideoLink};
export type ZzzStat={key:string;value:number};
export type ZzzDisc={id:string;level:number;main:ZzzStat;subs:ZzzStat[]};
export type ZzzSetup={id:string;revision:number;name:string;characterId:string;level:number;chain:number;weaponId:string;weaponLevel:number;weaponRank:number;skills:number[];core:number;discs:ZzzDisc[];stats:Record<string,number>;notes:string};
export type ZzzTeam={members:ZzzSetup[];bangbooId:string|null;durationMs:number|null;score:number|null};
export type ZzzRecord={id:string;revision:number;cycleId:string;stageId:string;playedAt:string;teams:ZzzTeam[];party:ZzzSetup[];durationMs:number|null;score:number|null;rank:string;videoUrl:string;videoStartSeconds:number;notes:string;author:string;verified:boolean;createdAt:number;state?:string;mine?:boolean};
export type ZzzCatalog={version:string;checkedAt:string;characters:{id:string;name:Localized;profession:string;elements:string[];rank:string;icon:string;artwork:string}[];weapons:{id:string;name:Localized;profession:string;rank:string;icon:string}[];sets:{id:string;name:Localized;icon:string}[];discItems:{id:string;setId:string;rarity:number;rank:string;slot:number}[];stats:{id:string;name:Localized;unit:string}[];bangboo:{id:string;name:Localized;icon:string}[];cycles:{id:string;name:Localized;startDate:string|null;endDate:string|null;buffs:Localized[]}[];stages:{id:string;name:Localized;teams:number}[];sources:{url:string;label:string}[]};
const int=(v:unknown,min:number,max:number)=>Number.isSafeInteger(v)&&Number(v)>=min&&Number(v)<=max;
const text=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v);
const exact=(v:unknown,keys:string[]):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k));
const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1000000;
export const zzzName=(rows:{id:string;name:Localized}[],id:string,l:keyof Localized)=>rows.find(x=>x.id===id)?.name[l]||id;
export function validZzzSetup(v:unknown,c:ZzzCatalog):v is ZzzSetup{
 if(!exact(v,['id','revision','name','characterId','level','chain','weaponId','weaponLevel','weaponRank','skills','core','discs','stats','notes']))return false;
 const a=c.characters.find(x=>x.id===v.characterId),w=c.weapons.find(x=>x.id===v.weaponId);
 if(!uuid(v.id)||!int(v.revision,0,1000000)||!text(v.name,80)||!v.name.trim()||!a||!w||a.profession!==w.profession||!int(v.level,1,60)||!int(v.chain,0,6)||!int(v.weaponLevel,1,60)||!int(v.weaponRank,1,5)||!int(v.core,0,6)||!Array.isArray(v.skills)||v.skills.length!==5||!v.skills.every((n:unknown)=>int(n,1,12+(v.chain>=3?2:0)+(v.chain>=5?2:0)))||!text(v.notes,1500))return false;
 if(!exact(v.stats,c.stats.map(s=>s.id))||!Object.values(v.stats).every(number)||!Array.isArray(v.discs)||v.discs.length!==6)return false;
 const stat=(s:unknown)=>exact(s,['key','value'])&&c.stats.some(k=>k.id===s.key)&&number(s.value);
 return v.discs.every((d:any,i:number)=>{if(!exact(d,['id','level','main','subs']))return false;const item=c.discItems.find(x=>x.id===d.id);return !!item&&item.slot===i+1&&int(d.level,0,({2:9,3:12,4:15} as Record<number,number>)[item.rarity]||15)&&stat(d.main)&&d.main.value>0&&Array.isArray(d.subs)&&d.subs.length<=4&&d.subs.every((s:unknown)=>stat(s)&&(s as ZzzStat).value>0)&&new Set(d.subs.map((s:ZzzStat)=>s.key)).size===d.subs.length;});
}
export function blankZzzSetup(c:ZzzCatalog):ZzzSetup{const a=c.characters[0],w=c.weapons.find(w=>w.profession===a?.profession);return{id:crypto.randomUUID(),revision:0,name:'',characterId:a?.id||'',level:60,chain:0,weaponId:w?.id||'',weaponLevel:60,weaponRank:1,skills:[12,12,12,12,12],core:6,discs:Array.from({length:6},()=>({id:'',level:15,main:{key:c.stats[0]?.id||'',value:0},subs:[]})),stats:{},notes:''};}
export function validZzzRecord(v:unknown,c:ZzzCatalog,today:string){
 if(!exact(v,['action','accountScope','id','cycleId','stageId','playedAt','teams','durationMs','score','rank','videoUrl','videoStartSeconds','notes','publish']))return false;
 const cycle=c.cycles.find(x=>x.id===v.cycleId),stage=c.stages.find(x=>x.id===v.stageId),date=v.playedAt;
 if(!uuid(v.id)||!cycle||!stage||!Array.isArray(v.teams)||v.teams.length!==stage.teams||!text(date,10)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||date>today||cycle.startDate&&date<cycle.startDate||cycle.endDate&&date>=cycle.endDate)return false;
 const used=new Set<string>();for(const t of v.teams){if(!exact(t,['setupIds','bangbooId','durationMs','score'])||!Array.isArray(t.setupIds)||t.setupIds.length<1||t.setupIds.length>3||!t.setupIds.every(uuid)||t.setupIds.some((id:string)=>used.has(id))||new Set(t.setupIds).size!==t.setupIds.length||t.bangbooId!==null&&!c.bangboo.some(b=>b.id===t.bangbooId)||t.durationMs!==null&&!int(t.durationMs,1,86400000)||t.score!==null&&!int(t.score,0,100000000))return false;for(const id of t.setupIds)used.add(id);}
 return (v.durationMs===null||int(v.durationMs,1,86400000))&&(v.score===null||int(v.score,0,100000000))&&(v.durationMs!==null||v.score!==null)&&text(v.rank,20)&&recordVideoLink(v.videoUrl,v.videoStartSeconds)!==null&&text(v.notes,3000)&&v.publish===true;
}
