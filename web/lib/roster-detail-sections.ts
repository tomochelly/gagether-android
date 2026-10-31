import {rosterCopy,type RosterCharacter} from './character-roster';
import type {Locale,Region} from './types';

/** Keep saved prose, but show exact migrated skill copies only once. */
export function rosterDetailSections(character:RosterCharacter,locale:Locale,service:Region){
 const copy=(text:string)=>text.replace(/\r\n/g,'\n').trim();
 const tables=(character.regionalSkillTables?.[service]||character.skillTables||[]).filter(t=>!t.regions||t.regions.includes(service));
 return (character.sections||[]).filter(section=>{
  if(section.regions&&!section.regions.includes(service))return false;
  const body=copy(rosterCopy(section.body,locale)),title=copy(rosterCopy(section.title,locale));if(!body)return false;
  return !tables.some(table=>{
   const name=copy(rosterCopy(table.name,locale)),type=copy(rosterCopy(table.type,locale)),description=copy(rosterCopy(table.description,locale));
   return !!description&&(title===name||title===type)&&(body===description||body===name+'\n'+description);
  });
 });
}
