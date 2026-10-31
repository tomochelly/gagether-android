import catalog from '../content/stat-icons.json' with {type:'json'};
import type {GameIcon,Locale,StatRow} from './types';
/** Native statistic glyphs match an exact label within one game. Owner icons take priority. */
export function statIcon(gameId:string|undefined,row:StatRow):GameIcon|undefined{
 if(row.icon)return row.icon;
 if(!gameId)return undefined;
 const matches=catalog.filter(def=>def.gameId===gameId&&(['ko','en','ja','zh'] as Locale[]).some(l=>!!row.label[l]&&def.labels[l].includes(row.label[l])));
 const unique=new Map(matches.map(def=>[def.icon.image,def.icon]));
 return unique.size===1?[...unique.values()][0]:undefined;
}
