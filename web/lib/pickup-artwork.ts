import type {Entry,Locale,EntityArtwork} from './types';
import {artworkForLocale,serviceArtworkLocale} from './artwork';
import {featuredMembers,editedEntryArtwork} from './presentation';
import {bluearchivePickupArtwork} from './bluearchive-pickup-artwork';
import {reviewedPickupArtwork,reviewedPickupGroupFallback} from './reviewed-pickup-artwork';
export function pickupArtwork(original:Entry,locale:Locale,mode:'preview'|'full'='preview'):{name:Entry['title'];art:EntityArtwork}[]{
 const entry=bluearchivePickupArtwork(mode==='preview'?reviewedPickupArtwork(original):original);
 const service=serviceArtworkLocale(entry.region,entry.gameId),members=featuredMembers(entry)||[];
 const root=artworkForLocale(entry,locale,mode,service);
 if(mode==='preview'&&reviewedPickupGroupFallback(entry))return root.image&&root.imageVerified?[{name:entry.title,art:root}]:[];
 if(editedEntryArtwork(entry)&&root.image&&root.imageVerified)return [{name:members[0]?.name||entry.title,art:root}];
 if(members.length){const found=members.flatMap(m=>{const art=artworkForLocale(m,locale,mode,service);return art.image&&art.imageVerified?[{name:m.name,art}]:[];});if(found.length)return found;}
 return root.image&&root.imageVerified?[{name:entry.title,art:root}]:[];
}
export const pickupHasArtwork=(entry:Entry,locale:Locale)=>pickupArtwork(entry,locale).length>0;
