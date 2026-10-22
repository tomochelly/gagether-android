import type {Entry,Locale,EntityArtwork} from './types';
import {artworkForLocale,serviceArtworkLocale} from './artwork';
import {featuredMembers,editedEntryArtwork} from './presentation';
export function pickupArtwork(entry:Entry,locale:Locale,mode:'preview'|'full'='preview'):{name:Entry['title'];art:EntityArtwork}[]{
 const service=serviceArtworkLocale(entry.region,entry.gameId),members=featuredMembers(entry)||[];
 const root=artworkForLocale(entry,locale,mode,service);
 if(editedEntryArtwork(entry)&&root.image&&root.imageVerified)return [{name:members[0]?.name||entry.title,art:root}];
 if(members.length){const found=members.flatMap(m=>{const art=artworkForLocale(m,locale,mode,service);return art.image&&art.imageVerified?[{name:m.name,art}]:[];});if(found.length)return found;}
 return root.image&&root.imageVerified?[{name:entry.title,art:root}]:[];
}
export const pickupHasArtwork=(entry:Entry,locale:Locale)=>pickupArtwork(entry,locale).length>0;
