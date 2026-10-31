import review from '../content/reviewed-official-pickups.json' with {type:'json'};
import {sameEditValue} from './inline-edit';
import type {Entry} from './types';

/** Exact confirmed clocks supplement an existing announced pool. */
export function reviewedOfficialPickup(entry:Entry):Entry{
 const rule=review.changes.find(r=>r.id===entry.id&&r.gameId===entry.gameId&&r.region===entry.region&&r.sourceUrl===entry.sourceUrl&&r.kind===entry.kind);if(!rule)return entry;
 let result=entry;
 for(const [field,delta] of Object.entries(rule.fields)){
  if(entry.editor?.fields.some(path=>path===field||path.startsWith(field+'.')||field.startsWith(path+'.')))continue;
  const value=(entry as unknown as Record<string,unknown>)[field];
  if(!sameEditValue(value,delta.before)||sameEditValue(value,delta.after))continue;
  if(result===entry)result={...entry};Object.assign(result,{[field]:structuredClone(delta.after)});
 }
 return result;
}
