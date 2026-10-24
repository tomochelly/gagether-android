import artwork from '../content/wuwa-reference-artwork.json' with {type:'json'};
import type {WuwaCharacter} from './wuwa-reference';
import type {Locale} from './types';
/** Explicit source IDs preserve exact Rover variants and old v1 snapshot compatibility. */
export function referenceArtwork(character:WuwaCharacter,variant=0){
 const portrait=character.portraits[variant];if(!portrait)return undefined;
 const known=(artwork.entries as Record<string,{url:string;width:number;height:number}>)[String(portrait.id)];
 const url=portrait.artwork||known?.url;
 if(!url||!/^https:\/\/raw\.githubusercontent\.com\/DommyMM\/wuwabuild\/main\/public\/assets\/UIResources\/[A-Za-z0-9_./-]+\.(webp|png)$/.test(url)||url.includes('..'))return undefined;
 return {url,...(known?.url===url?{width:known.width,height:known.height}:{})};
}
export function compareResonators(a:WuwaCharacter,b:WuwaCharacter,sort:string,locale:Locale){
 const name=()=>a.name[locale].localeCompare(b.name[locale],locale)||a.id.localeCompare(b.id,'en',{numeric:true});
 const debut=()=>(b.debut?.date||'').localeCompare(a.debut?.date||'')||name();
 return sort==='rarity'?b.rarity-a.rarity||debut():sort==='debut'?debut():name();
}
