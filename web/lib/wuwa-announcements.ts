import rows from '../content/wuwa-announced-roster.json' with {type:'json'};
import type {RosterCharacter} from './character-roster';
import type {WuwaCharacter} from './wuwa-reference';
const announcements=rows as RosterCharacter[];
const native=(value:string)=>value.normalize('NFKC').trim().toLowerCase();
export function releasedAnnouncement(row:RosterCharacter,characters:WuwaCharacter[]){
 return characters.find(c=>(['ko','en','ja','zh']as const).filter(l=>row.name[l]&&c.name?.[l]&&native(row.name[l])===native(c.name[l])).length>=2);
}
export function wuwaAnnouncements(characters:WuwaCharacter[]){return announcements.filter(c=>!releasedAnnouncement(c,characters));}
export function wuwaAnnouncement(id:string){return announcements.find(c=>c.id===id);}
