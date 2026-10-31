import type {RosterCharacter} from './character-roster';

/** Supplement exact source glyphs without replacing any saved numerical/prose facts. */
export function retainEndfieldRosterIcons(current:RosterCharacter,reference:RosterCharacter):RosterCharacter{
 if(current.id!==reference.id)return current;
 const icons=<T extends {id:string;icon?:string}>(values:T[]|undefined,extra:T[]|undefined)=>{
  if(!values||!extra)return values;const known=new Map(extra.map(row=>[row.id,row]));
  return values.map(row=>!row.icon&&known.get(row.id)?.icon?{...row,icon:known.get(row.id)!.icon}:row);
 };
 const known=new Map(reference.skillTables?.map(row=>[row.id,row])||[]);
 const skillTables=current.skillTables?.map(row=>{
  const extra=known.get(row.id);if(!extra||row.sourceUrl!==extra.sourceUrl||row.sourceKind!==extra.sourceKind)return row;
  return {...row,icon:row.icon||extra.icon,values:icons(row.values,extra.values)!};
 });
 const prior=reference.statProgression,p=current.statProgression;
 const statProgression=p&&prior&&p.sourceUrl===prior.sourceUrl&&p.sourceKind===prior.sourceKind?{...p,stats:icons(p.stats,prior.stats)!}:p;
 const sections=current.sections?.map(section=>{
  const extra=reference.sections?.find(row=>row.id===section.id);
  return !section.icon&&extra?.icon&&JSON.stringify(section.title)===JSON.stringify(extra.title)&&JSON.stringify(section.body)===JSON.stringify(extra.body)?{...section,icon:extra.icon}:section;
 });
 return {...current,...skillTables?{skillTables}:{},...statProgression?{statProgression}:{},...sections?{sections}:{}};
}
