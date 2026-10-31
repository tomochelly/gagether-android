import catalog from '../content/wuwa-wastes-tokens.json' with {type:'json'};
import type {Localized} from './types';
export type WastesToken={id:string;name:Localized;description:Localized;icon:string;rarity:number;maxUses:number|null;useLimit:'limited'|'unlimited'|'unknown';effectAvailable:boolean;cycleIds:string[];availability:'source-cycle'|'catalog-only';imageStatus:'declared-unverified';sourceUrl:string};
export type WastesTokenCatalog={version:1;sourceVersion:string;checkedAt:string;tokens:WastesToken[];cycles:{id:string;startDate:string;endDate:string;tokenIds:string[];sourceUrl:string;scope:'reward-entries-only'}[];sources:{name:string;url:string;kind:string;checkedAt:string}[];limits:{maxEquippedPerRun:null;maxEquippedPerTeam:null;useLimitScope:string};coverage:{tokens:number;effectsAvailable:number;missingEffectIds:string[];nativeLocales:number;currentCycleAvailability:'unknown';imageDelivery:string}};
export function validateWastesTokenCatalog(value:WastesTokenCatalog){
 if(value.version!==1||!/^\d+\.\d+\.\d+$/.test(value.sourceVersion)||!Number.isFinite(Date.parse(value.checkedAt))||!Array.isArray(value.tokens)||value.tokens.length<100||new Set(value.tokens.map(t=>t.id)).size!==value.tokens.length)throw Error('Invalid WW token inventory');
 const ids=new Set(value.tokens.map(t=>t.id)),locales=['ko','en','ja','zh'] as const;
 for(const t of value.tokens){
  if(!/^715\d{5}$/.test(t.id)||![2,3,4,5].includes(t.rarity)||typeof t.effectAvailable!=='boolean'||locales.some(l=>typeof t.name[l]!=='string'||!t.name[l].trim()||typeof t.description[l]!=='string'||t.effectAvailable&&!t.description[l].trim()||/<[^>]*>/.test(t.description[l]))||!/^https:\/\/wutherin\.cn-nb1\.rains3\.com\/UI\/UIResources\/Common\/Image\/IconMowing\/T_IconMowing_\d+\.webp$/.test(t.icon)||t.sourceUrl!=='https://wuther.in/ko/item/'+t.id+'/')throw Error('Invalid native WW token identity');
  if(!['limited','unlimited','unknown'].includes(t.useLimit)||t.useLimit==='limited'&&(!Number.isSafeInteger(t.maxUses)||t.maxUses!<1||t.maxUses!>100)||t.useLimit!=='limited'&&t.maxUses!==null)throw Error('Invalid source token use limit');
  if(t.imageStatus!=='declared-unverified')throw Error('Unverified token image cannot claim verification');
 }
 for(const cycle of value.cycles)if(!/^whimpering-wastes:\d+$/.test(cycle.id)||cycle.scope!=='reward-entries-only'||cycle.tokenIds.some(id=>!ids.has(id)))throw Error('Invalid token reward-cycle scope');
 if(value.limits.maxEquippedPerRun!==null||value.limits.maxEquippedPerTeam!==null||value.coverage.currentCycleAvailability!=='unknown')throw Error('Unknown equip/current-cycle limits must remain unknown');
 if(value.coverage.tokens!==value.tokens.length||value.coverage.effectsAvailable!==value.tokens.filter(t=>t.effectAvailable).length)throw Error('Token coverage mismatch');
 return value;
}
/** Full source catalog; four effect-less legacy rows are retained but not selectable. */
export const wastesTokens=validateWastesTokenCatalog(catalog as WastesTokenCatalog);
export const wastesTokenCatalog=wastesTokens;
export const selectableWastesTokens=wastesTokens.tokens.filter(t=>t.effectAvailable);
export function wastesToken(id:string){return wastesTokens.tokens.find(t=>t.id===id);}
