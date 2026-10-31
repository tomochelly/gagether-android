import catalog from '../content/wuwa-equipment-catalog.json' with {type:'json'};
import type {Localized} from './types';
export type WuwaEcho={id:string;name:Localized;icon:string;cost:number;setIds:string[];phantomIcon?:string};
export type WuwaSet={id:string;name:Localized;icon:string};
export type WuwaWeapon={id:string;name:Localized;icon:string;typeId:number;rarity:number};
export type WuwaEquipmentCatalog={version:1;sourceVersion:string;sourceCommit:string;checkedAt:string;sources:{name:string;url:string;kind:string;checkedAt:string;sha256?:string}[];echoes:WuwaEcho[];sets:WuwaSet[];weapons:WuwaWeapon[];statLabels:Record<string,Localized>;mainStats:Record<string,Record<string,number[]>>;subStats:Record<string,number[]>;defaultMainStats:Record<string,{key:string;values:number[]}>};
const original=(url:string)=>/^https:\/\/raw\.githubusercontent\.com\/DommyMM\/wuwabuild\/[a-f0-9]{40}\/public\/assets\/UIResources\/[A-Za-z0-9_./-]+\.webp$/.test(url)&&!url.includes('..');
export function validateEquipmentCatalog(value:WuwaEquipmentCatalog){
 if(value.version!==1||!/^\d+\.\d+$/.test(value.sourceVersion)||!/^([a-f0-9]{40})$/.test(value.sourceCommit)||!Number.isFinite(Date.parse(value.checkedAt)))throw Error('Invalid equipment source');
 const names=(row:{id:string;name:Localized;icon:string})=>/^[1-9]\d*$/.test(row.id)&&['ko','en','ja','zh'].every(l=>typeof row.name?.[l as keyof Localized]==='string'&&!!row.name[l as keyof Localized].trim())&&original(row.icon)&&row.icon.includes('/'+value.sourceCommit+'/');
 for(const rows of [value.echoes,value.sets,value.weapons])if(!Array.isArray(rows)||!rows.length||new Set(rows.map(row=>row.id)).size!==rows.length||rows.some(row=>!names(row)))throw Error('Incomplete equipment identities');
 const sets=new Set(value.sets.map(row=>row.id));
 if(value.echoes.length<150||value.echoes.some(row=>![1,3,4].includes(row.cost)||!row.setIds.length||new Set(row.setIds).size!==row.setIds.length||row.setIds.some(id=>!sets.has(id))||row.phantomIcon&&!original(row.phantomIcon)))throw Error('Incomplete Echo inventory');
 if(value.weapons.some(row=>![1,2,3,4,5].includes(row.typeId)||![1,2,3,4,5].includes(row.rarity)))throw Error('Invalid native weapon type');
 if(Object.values(value.subStats).some(values=>!values.length||values.some(n=>!Number.isFinite(n)||n<0))||['1cost','3cost','4cost'].some(cost=>!value.mainStats[cost]||Object.values(value.mainStats[cost]).some(values=>values.length!==2||values.some(n=>!Number.isFinite(n)||n<0))))throw Error('Invalid Echo stat definitions');
 if([...Object.keys(value.subStats),...Object.values(value.mainStats).flatMap(Object.keys)].some(key=>!value.statLabels[key]||['ko','en','ja','zh'].some(locale=>!value.statLabels[key][locale as keyof Localized])))throw Error('Missing native stat label');
 return value;
}
/** Public original URLs are pinned to the exact inspected source commit. */
export const equipmentCatalog=validateEquipmentCatalog(catalog as WuwaEquipmentCatalog);
