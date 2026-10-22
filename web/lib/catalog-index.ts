import type {Entry} from './types';

/** Transport-only metadata. Full records and owner edits remain in the store. */
export type CatalogEntry=Entry&{detailsDeferred?:true;detailRevision?:string};
export function catalogEntry(entry:Entry,revision?:string):CatalogEntry{
 const {entityDetails,detailImages,detailSections,...summary}=entry as CatalogEntry;
 return {...summary,detailsDeferred:true,detailRevision:revision||summary.detailRevision||entry.verifiedAt};
}
export function detailKey(entry:Entry){
 const e=entry as CatalogEntry;
 return JSON.stringify([e.id,e.detailRevision||e.verifiedAt,e.editor?.revision||0]);
}
export const detailsDeferred=(entry:Entry|null|undefined)=>!!(entry as CatalogEntry|undefined)?.detailsDeferred;
