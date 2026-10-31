import type {Entry,Localized} from './types';
import {featuredMembers} from './presentation';
export function montageMembers(entry:Entry){
 const candidates=entry.pickupMembers?.filter(m=>m.role==='candidate')||[];
 // A reviewed candidate pool can have an unknown choice count and no root poster.
 if(entry.kind==='pickup'&&['character','standard'].includes(entry.poolType||'character')&&candidates.length>1&&!entry.image&&candidates.every(m=>m.image&&m.imageVerified))return candidates;
 if(entry.kind!=='pickup'||entry.poolType&&entry.poolType!=='character'||entry.editor?.fields.some(key=>['image','localizedArtwork','imageFraming','previewFocus','previewBounds','previewArtwork','imagePosition','imageLocale','pickupMembers'].includes(key)))return [];
 return (entry.selectionCount?entry.pickupMembers:featuredMembers(entry))||[];
}
const identity=(name:string)=>name.normalize('NFKC').replace(/\s+/g,'').toLocaleLowerCase('en');
/** Exact form names only. Never remove costume/element suffixes or use fuzzy matching. */
export function exactMontageCharacter<T extends {name:Localized;regions?:string[]}>(name:Localized,rows:T[],region:string){
 const names=Object.values(name).filter(Boolean).map(identity);
 const found=rows.filter(row=>(!row.regions?.length||row.regions.includes(region))&&Object.values(row.name).some(n=>n&&names.includes(identity(n))));
 return found.length===1?found[0]:undefined;
}
