import {fullCharacterArt,declaredFullArtwork} from './wuwa-reference-art';
import type {WuwaCharacter} from './wuwa-reference';
import type {Locale} from './types';
/** Exact full originals override the former cropped menu artwork, including old v1 snapshots. */
export function referenceArtwork(character:WuwaCharacter,variant=0){
 const portrait=character.portraits[variant];if(!portrait)return undefined;
 const known=fullCharacterArt[String(portrait.id)];if(known)return known;
 const url=declaredFullArtwork(portrait.fullArtwork);return url?{url,kind:'full-splash' as const,sourceUrl:character.sourceUrl,width:undefined,height:undefined,focus:undefined}:undefined;
}
export function compareResonators(a:WuwaCharacter,b:WuwaCharacter,sort:string,locale:Locale){
 const name=()=>a.name[locale].localeCompare(b.name[locale],locale)||a.id.localeCompare(b.id,'en',{numeric:true});
 const debut=()=>(b.debut?.date||'').localeCompare(a.debut?.date||'')||name();
 return sort==='rarity'?b.rarity-a.rarity||debut():sort==='debut'?debut():name();
}
