import {maintainedGalleryFocus} from './gallery-focus-runtime';
import {arknightsGalleryFocus} from './arknights-gallery';
import {rosterArtFrame,type RosterArtPlacement,type RosterArtSurface} from './roster-art-framing';
import {reviewedRosterArtEntry} from './roster-art-replacements';
/** Reviewed exact original only; replacement images and other games retain their existing framing. */
export function rosterGalleryFocus(gameId:string|undefined,url?:string){
 const reviewed=maintainedGalleryFocus(gameId,url);if(reviewed)return reviewed;
 if(gameId==='arknights')return arknightsGalleryFocus(url);
 const row=reviewedRosterArtEntry(gameId,url);
 return row?.head?{...row.head,width:row.width,height:row.height}:undefined;
}

/** Same declared composition may retain an owner frame saved against its earlier delivery URL. */
export function reviewedRosterArtFrame(gameId:string|undefined,frames:RosterArtPlacement[]|undefined,url:string|undefined,surface:RosterArtSurface){const exact=rosterArtFrame(frames,url,surface);if(exact)return exact;const row=reviewedRosterArtEntry(gameId,url);for(const alias of row?.aliases||[]){const frame=rosterArtFrame(frames,alias,surface);if(frame)return frame;}return undefined;}
