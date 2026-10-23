import catalog from '../content/trait-icons.json' with {type:'json'};
import type {EntityTrait,GameIcon,Locale} from './types';
/** Reuse only a reviewed icon for the same game's exact trait/value, across service languages. */
export function traitIcon(gameId:string|undefined,trait:EntityTrait):GameIcon|undefined{
 if(trait.icon)return trait.icon;
 if(!gameId)return undefined;
 const matches=catalog.filter(row=>row.gameId===gameId&&row.id===trait.id&&(['ko','en','ja','zh'] as Locale[]).some(locale=>!!trait.value[locale]&&row.values[locale].includes(trait.value[locale])));
 const unique=new Map(matches.map(row=>[row.icon.image,row.icon]));
 return unique.size===1?[...unique.values()][0]:undefined;
}
