import inventory from '../content/roster-detail-icons.json' with {type:'json'};
import type {RosterCharacter} from './character-roster';
const icons=new Map((inventory as {gameId:string;url:string;publicUrl:string;delivery?:string}[]).filter(a=>a.delivery!=='source-original').map(a=>[a.gameId+'|'+a.url,a.publicUrl]));
function mapChanged<T>(values:T[]|undefined,fn:(v:T)=>T){if(!values)return values;let changed=false;const mapped=values.map(v=>{const next=fn(v);changed ||=next!==v;return next});return changed?mapped:values;}
/** Only an exact reviewed same-game source glyph may use a pinned original. */
export function pinRosterFactIcons(c:RosterCharacter,gameId:string):RosterCharacter{
 const pin=<T extends {icon?:string}>(value:T):T=>{const next=value.icon&&icons.get(gameId+'|'+value.icon);return next&&next!==value.icon?{...value,icon:next}:value;};
 const tables=(values:RosterCharacter['skillTables'])=>mapChanged(values,s=>{const own=pin(s),rows=mapChanged(s.values,pin);return rows!==s.values?{...own,values:rows!}:own});
 const stats=mapChanged(c.stats,pin),traits=mapChanged(c.traits,pin),skillTables=tables(c.skillTables),p=c.statProgression,progressionStats=mapChanged(p?.stats,pin);
 const regionalStats=c.regionalStats&&Object.fromEntries(Object.entries(c.regionalStats).map(([region,values])=>[region,mapChanged(values,pin)]));
 const regionalSkillTables=c.regionalSkillTables&&Object.fromEntries(Object.entries(c.regionalSkillTables).map(([region,values])=>[region,tables(values)]));
 const regionalStatProgression=c.regionalStatProgression&&Object.fromEntries(Object.entries(c.regionalStatProgression).map(([region,value])=>[region,value?{...value,stats:mapChanged(value.stats,pin)!}:value]));
 const sections=mapChanged(c.sections,pin),variantDetails=c.variantDetails&&Object.fromEntries(Object.entries(c.variantDetails).map(([id,v])=>[id,{...v,stats:mapChanged(v.stats,pin),traits:mapChanged(v.traits,pin),skillTables:tables(v.skillTables),sections:mapChanged(v.sections,pin)}]));
 return {...c,...stats?{stats}:{},...traits?{traits}:{},...skillTables?{skillTables}:{},...sections?{sections}:{},...p&&progressionStats!==p.stats?{statProgression:{...p,stats:progressionStats!}}:{},...regionalStats?{regionalStats}:{},...regionalSkillTables?{regionalSkillTables}:{},...regionalStatProgression?{regionalStatProgression}:{},...variantDetails?{variantDetails}:{}};
}
