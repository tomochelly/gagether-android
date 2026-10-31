import review from '../content/recurring-review.json' with {type:'json'};
import type {Entry} from './types';
import {sameEditValue} from './inline-edit';

/** Reviewed field deltas are a public supplement, never a source-body rewrite.
 * An owner edit/unset or a different newly collected value always wins. */
export function reviewedRecurringEntry(entry:Entry):Entry{
 const rule=review.changes.find(r=>r.id===entry.id&&r.gameId===entry.gameId&&r.region===entry.region&&r.sourceUrl===entry.sourceUrl);
 if(!rule)return entry;
 let result=entry,changed=false;
 for(const [field,delta] of Object.entries(rule.fields)){
  if(entry.editor?.fields.includes(field))continue;
  if((entry as Entry&{detailsDeferred?:boolean}).detailsDeferred&&field==='detailSections')continue;
  const value=(entry as any)[field],d=delta as {before?:unknown;after:unknown};
  if(!sameEditValue(value,d.before)||sameEditValue(value,d.after))continue;
  if(!changed){result={...entry};changed=true;}
  (result as any)[field]=structuredClone(d.after);
 }
 if(changed)(result as Entry&{detailRevision?:string}).detailRevision=[(entry as Entry&{detailRevision?:string}).detailRevision||entry.verifiedAt,'recurring-review',review.reviewedAt].join(':');
 return result;
}
