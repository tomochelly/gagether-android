import {statNames,type CombatCatalog,type StatKey,type EchoSlot} from './wuwa-records';
import {echoMainStatOptions,echoMainStatValue,echoSecondaryStat,echoSubstatValues,isEchoSubstatStep} from './wuwa-echo-stat-rules';
export type PhotoStat={key:StatKey;value:number;line:string;decimalRestoredFrom?:number};
/** Restore one missing decimal only against the selected Echo's exact verified values. Raw OCR stays visible. */
export function normalizeEchoPhotoRows(rows:PhotoStat[],cost:number,level:number,rarity:number):PhotoStat[]{
 if(rarity!==5||![0,25].includes(level)||!echoMainStatOptions(cost,rarity).length)return rows;
 return rows.map(row=>{
  const token=row.line.normalize('NFKC').match(/(\d[\d, ]*(?:[.]\d+)?)\s*%\s*$/)?.[1];
  if(!token||/[.,]/.test(token)||!Number.isInteger(row.value)||['hp','atk','def'].includes(row.key))return row;
  const main=echoMainStatValue(cost,row.key,level,rarity),values=[...(main===null?[]:[main]),...(level>=5?echoSubstatValues(row.key,rarity):[])];
  if(values.some(n=>Math.abs(n-row.value)<.001))return row;
  const restored=row.value/10;
  return values.some(n=>Math.abs(n-restored)<.001)?{...row,value:restored,decimalRestoredFrom:row.value}:row;
 });
}
const fold=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const aliases=Object.entries(statNames).flatMap(([key,names])=>Object.values(names).map(name=>({key:key as StatKey,name:fold(name)})));
for(const[key,names]of Object.entries({critRate:['크리티컬','치명타 확률','Crit. Rate'],critDamage:['크리티컬 피해','치명타 피해','Crit. DMG'],energyRegen:['공명 효율','에너지 재생'],basicDamage:['일반 공격 피해 보너스','기본 공격 피해','Basic Attack DMG Bonus','Basic Attack Damage Bonus'],heavyDamage:['강공격 피해 보너스','Heavy Attack DMG Bonus','Heavy Attack Damage Bonus'],skillDamage:['공명 스킬 피해 보너스','Resonance Skill DMG Bonus','Resonance Skill Damage Bonus'],liberationDamage:['공명 해방 피해 보너스','Resonance Liberation DMG Bonus','Resonance Liberation Damage Bonus']}))for(const name of names)aliases.push({key:key as StatKey,name:fold(name)});
aliases.sort((a,b)=>b.name.length-a.name.length);
export function parsePhotoText(text:string,c:CombatCatalog){
 const rows:PhotoStat[]=[],warnings:string[]=[];for(const line of text.slice(0,30000).split(/\r?\n/)){const values=[...line.matchAll(/\d[\d, ]*(?:[.]\d+)?\s*[%％]?/g)];if(!values.length)continue;const number=values.at(-1)!,prefix=fold(line.slice(0,number.index)),a=aliases.find(a=>a.name.length>1&&(prefix===a.name||prefix.endsWith(a.name)));if(!a)continue;const token=number[0],value=Number(token.replace(/[,\s%％]/g,''));if(!Number.isFinite(value)||value<0||value>1000000)continue;let key=a.key;if(/[%％]/.test(token)&&['hp','atk','def'].includes(key))key=(key+'Percent')as StatKey;rows.push({key,value,line:line.trim()});}
 const title=fold(text.slice(0,6000)),matches=c.echoes.filter(e=>Object.values(e.name).some(n=>fold(n).length>=3&&title.includes(fold(n)))).sort((a,b)=>Math.max(...Object.values(b.name).map(n=>fold(n).length))-Math.max(...Object.values(a.name).map(n=>fold(n).length)));
 const echoId=matches[0]?.id,levels=[...text.matchAll(/(?:\+\s*|(?:강화|Enhance(?:ment)?|Level|等级|強化)\s*[:：]?\s*)(\d{1,2})(?!\d)/gi)].map(m=>Number(m[1])).filter(n=>n<=25),level=levels.length&&new Set(levels).size===1?levels[0]:undefined;
 const seen=new Map<string,number>();for(const r of rows){if(seen.has(r.key)&&seen.get(r.key)!==r.value)warnings.push(r.key);seen.set(r.key,r.value);}return{rows,echoId,level,ambiguous:[...new Set(warnings)]};
}
export function photoEchoRows(rows:PhotoStat[],cost:number,level:number,rarity:number){const allowed=echoMainStatOptions(cost,rarity),main=rows.findIndex(r=>allowed.includes(r.key)&&echoMainStatValue(cost,r.key,level,rarity)!==null&&Math.abs((echoMainStatValue(cost,r.key,level,rarity)??-999)-r.value)<.001),secondary=echoSecondaryStat(cost,level,rarity);return{main,subs:rows.map((r,index)=>({r,index})).filter(({r,index})=>index!==main&&!(secondary&&secondary.key===r.key&&Math.abs(secondary.value-r.value)<.001)&&isEchoSubstatStep(r.key,r.value,rarity)).map(v=>v.index)};}
export function applyEchoPhoto(current:EchoSlot,c:CombatCatalog,id:string,level:number,rarity:number,main:PhotoStat|undefined,subs:PhotoStat[],replaceSubs:boolean):EchoSlot|null{const echo=c.echoes.find(e=>e.id===id);if(!echo||!Number.isInteger(level)||!Number.isInteger(rarity)||rarity<1||rarity>5||level<0||level>rarity*5||subs.length>Math.min(5,Math.floor(level/5))||new Set(subs.map(s=>s.key)).size!==subs.length)return null;const valid=(r:PhotoStat)=>Number.isFinite(r.value)&&r.value>0&&r.value<=1000000;
 if(main&&(!valid(main)||!Object.hasOwn(c.mainStats?.[echo.cost+'cost']||{},main.key)))return null;if(subs.some(r=>!valid(r)||!Object.hasOwn(c.subStats||{},r.key)||rarity===5&&!isEchoSubstatStep(r.key,r.value,rarity)))return null;
 const expected=main?echoMainStatValue(echo.cost,main.key,level,rarity):null;if(main&&expected!==null&&Math.abs(expected-main.value)>.001)return null;
 const same=current.echoId===id,base=replaceSubs||!same?[]:current.subs,next=[...base.filter(s=>!subs.some(v=>v.key===s.key)),...subs.map(({key,value})=>({key,value}))];if(next.length>Math.min(5,Math.floor(level/5)))return null;
 return{echoId:id,setId:echo.setIds.includes(current.setId)?current.setId:echo.setIds[0],rarity,level,main:main?{key:main.key,value:main.value}:same?current.main:{key:(Object.keys(c.mainStats?.[echo.cost+'cost']||{})[0]||'atkPercent')as StatKey,value:0},subs:next};}
