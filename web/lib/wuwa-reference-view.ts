import releaseEvidence from '../content/wuwa-release-evidence.json' with {type:'json'};
import {fullCharacterArt,declaredFullArtwork} from './wuwa-reference-art';
import type {WuwaCharacter} from './wuwa-reference';
import type {Locale} from './types';
/** Exact full originals override the former cropped menu artwork, including old v1 snapshots. */
export function referenceArtwork(character:WuwaCharacter,variant=0){
 const portrait=character.portraits[variant];if(!portrait)return undefined;
 const known=fullCharacterArt[String(portrait.id)];if(known)return known;
 const url=declaredFullArtwork(portrait.fullArtwork);return url?{url,kind:'full-splash' as const,sourceUrl:character.sourceUrl,width:undefined,height:undefined,focus:undefined}:undefined;
}
/** Conflicting regional day labels can still establish chronology. They are sort bounds, never public confirmed dates. */
export function firstReleaseOrder(character:WuwaCharacter){
 const name=character.id.startsWith('rover-')?'Rover-'+character.element.name.en:character.name.en;
 const entry=releaseEvidence.entries.find(e=>e.nameEn===name),dates=[entry?.date,...(entry?.evidence||[]).map(e=>e.date)].filter((date):date is string=>typeof date==='string'&&/^\d{4}-\d\d-\d\d$/.test(date)).sort();
 return dates[0]||character.debut?.date||'';
}
export function compareResonators(a:WuwaCharacter,b:WuwaCharacter,sort:string,locale:Locale){
 const name=()=>a.name[locale].localeCompare(b.name[locale],locale)||a.id.localeCompare(b.id,'en',{numeric:true});
 const debut=()=>firstReleaseOrder(b).localeCompare(firstReleaseOrder(a))||name();
 return sort==='rarity'?b.rarity-a.rarity||debut():sort==='debut'?debut():name();
}
