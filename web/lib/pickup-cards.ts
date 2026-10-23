import type {Entry,EntityArtwork} from './types';
import {featuredMembers,editedEntryArtwork} from './presentation';

// View models only: the rotation ID, calendar, owner revision and saved item remain
// canonical. Never persist a narrowed member as an automatic/editorial record.
const artworkKeys=['image','imageSource','imageKind','imageFit','imagePosition','imageVerified','imageLocale','imageCaption','originalLanguageFallback','textFreePreview','imageFraming','previewFocus','previewBounds','previewArtwork','localizedArtwork'] as const;
export function pickupCards(entries:Entry[]){
 return entries.flatMap(entry=>{
  const members=featuredMembers(entry)||[];
  if(entry.kind!=='pickup'||entry.selectionCount||members.length<2)return [{key:entry.id,entry,display:entry}];
  return members.map(member=>{
   const display={...entry,title:member.name,pickupType:member.type,rarity:member.rarity||entry.rarity,pickupMembers:[member]};
   // A pool poster or another member's illustration cannot fill this character.
   for(const key of artworkKeys)delete (display as EntityArtwork)[key];
   for(const key of artworkKeys)if(member[key]!==undefined)Object.assign(display,{[key]:member[key]});
   // Root art overrides apply only to a genuinely single-member canonical entry.
   if(!editedEntryArtwork(entry))delete display.editor;
   return {key:entry.id+':'+JSON.stringify(member.name),entry,display};
  });
 });
}
