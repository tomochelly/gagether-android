import extra from '../content/pickup-thumbnail-focus.json' with {type:'json'};
import type {Entry,Localized,EntityArtwork,Locale} from './types';
import {samePickupName} from './pickup-names';
import {rosterGalleryFocus} from './roster-gallery-focus';
import {reviewedPickupHead} from './reviewed-pickup-artwork';
import {isReviewedPickupDefaultFrame} from './reviewed-pickup-artwork';
import {imageFrame} from './image-framing';
/** Members belong to this exact pool; do not turn every single featured member into the whole group. */
export function thumbnailMembers(entry:Entry,name:Localized){
 if(entry.kind!=='pickup'||!['character','standard'].includes(entry.poolType||'character')||!samePickupName(entry.title,name))return[];
 const candidates=entry.pickupMembers?.filter(m=>m.role==='candidate')||[];
 if(candidates.length>1)return candidates;
 return entry.selectionCount&&(entry.pickupMembers?.length||0)>1?entry.pickupMembers!:[];
}
export function pickupThumbnailHead(gameId:string,art:EntityArtwork){const row=extra.entries.find(r=>r.gameId===gameId&&(r.image===art.image||new URL(r.image,'https://gagether.wiki').pathname===art.image));return reviewedPickupHead(art)||rosterGalleryFocus(gameId,art.image)||(row?{...row.head,width:row.width,height:row.height}:undefined);}
export function pickupThumbnailFrame(art:EntityArtwork){const frame=imageFrame(art,'card');return frame&&!isReviewedPickupDefaultFrame(art,frame)?frame:undefined;}
/** Cleared locale slots and saved card compositions remain authoritative. */
export function canUseRosterThumbnail(art:EntityArtwork,locale:Locale,serviceLocale?:Locale){const translated=art.localizedArtwork?.[serviceLocale||locale];return !(translated&&(!translated.image||!translated.imageVerified))&&!pickupThumbnailFrame(art)&&!(translated&&pickupThumbnailFrame(translated));}
