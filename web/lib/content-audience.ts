import type {Entry,Game,Locale,Region} from './types';
import {effectiveRegion,inSchedule} from './presentation';

export const localeMarket=(locale:Locale):Region=>locale==='ko'?'kr':locale==='ja'?'jp':'global';
/** An independently selected service determines territory; a shared schedule does not. */
export function independentService(game:Game,requested:Region){
 const canonical=effectiveRegion(game,requested);
 return game.serviceMode!=='shared-global'&&!Object.entries(game.regionAliases||{}).some(([alias,target])=>alias!==canonical&&target===canonical);
}
export function audienceMarket(game:Game,requested:Region,locale:Locale):Region{
 const canonical=effectiveRegion(game,requested);
 if(independentService(game,requested))return canonical;
 return localeMarket(locale);
}
export function contentLanguage(game:Game,requested:Region,locale:Locale):Locale{
 const market=audienceMarket(game,requested,locale);
 if(market==='global'&&independentService(game,requested))return 'en';
 return market==='jp'?'ja':market==='cn'?'zh':market==='kr'?'ko':locale;
}
const cashCodes=new Set(['KRW','JPY','CNY','USD','EUR','GBP','TWD','HKD']);
export function contentInAudience(entry:Entry,game:Game,requested:Region,locale:Locale){
 if(entry.gameId!==game.id||!inSchedule(entry,game,requested))return false;
 const market=audienceMarket(game,requested,locale);
 if(entry.audienceRegions?.length&&!entry.audienceRegions.includes(market))return false;
 // marketRegion also describes eligibility for local events and offline campaigns.
 if(entry.marketRegion&&entry.marketRegion!=='global'&&entry.marketRegion!==market)return false;
 if(entry.price&&cashCodes.has(entry.price.currency.trim().toUpperCase())){
  if(!entry.marketRegion||entry.marketRegion!==market)return false;
  // Never use another market's cash amount merely because its schedule is shared.
  const currency=entry.price.currency.trim().toUpperCase();
  if(market==='global'&&['KRW','JPY','CNY'].includes(currency))return false;
 }
 // Local physical campaigns without reviewed territory must not be promoted globally.
 if(entry.collaboration&&['offline','merchandise'].includes(entry.collaboration.scope)&&!entry.marketRegion&&!entry.audienceRegions?.length)return false;
 if(entry.broadcast&&entry.broadcast.locale!==contentLanguage(game,requested,locale))return false;
 return true;
}
/** Propagate a reviewed territorial restriction to duplicate feed rows of the same notice. */
export function audienceRestrictions(entries:Entry[]){
 const regions=new Map<string,Set<Region>>();
 for(const e of entries){
  const values=e.audienceRegions?.length?e.audienceRegions:e.kind!=='package'&&e.marketRegion&&e.marketRegion!=='global'?[e.marketRegion]:[];
  if(!values.length)continue;
  const key=e.gameId+'|'+e.sourceUrl,set=regions.get(key)||new Set<Region>();values.forEach(r=>set.add(r));regions.set(key,set);
 }
 return (e:Entry)=>e.audienceRegions?.length?e:{...e,audienceRegions:regions.has(e.gameId+'|'+e.sourceUrl)?[...regions.get(e.gameId+'|'+e.sourceUrl)!]:undefined};
}
