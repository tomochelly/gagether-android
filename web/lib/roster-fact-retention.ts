import {cleanRosterArt} from './character-roster-art-guard';
import type {RosterCharacter} from './character-roster';
const locales=['ko','en','ja','zh'] as const;
function fillCopy(primary:RosterCharacter['name'],extra:RosterCharacter['name']){
 return Object.fromEntries(locales.map(l=>[l,primary[l]||extra[l]])) as RosterCharacter['name'];
}
function mergeStats(primary:RosterCharacter['stats'],extra:RosterCharacter['stats']){
 const known=new Map(extra?.map(s=>[s.id,s])||[]),merged=(primary||[]).map(s=>{const old=known.get(s.id);known.delete(s.id);return old?{...old,...s,label:fillCopy(s.label,old.label),basis:fillCopy(s.basis,old.basis),value:s.value||old.value,icon:s.icon||old.icon}:s;});
 return merged.length||known.size?[...merged,...known.values()]:undefined;
}
/** Supplements a sparse source response with exact-ID, source-backed saved facts.
 * New source values win; a missing field is not an instruction to erase facts. */
export function retainCharacterFacts(c:RosterCharacter,extra:RosterCharacter):RosterCharacter{
  c=cleanRosterArt(c);extra=cleanRosterArt(extra);
  const full=extra.image&&(c.image?.kind==='portrait'&&extra.image.kind!=='portrait'||c.image?.kind==='card'&&['splash','full-body'].includes(extra.image.kind));
  const oldTraits=new Map(extra.traits?.map(t=>[t.id,t])||[]);
  const traits=c.traits?.length?c.traits.map(t=>{const old=oldTraits.get(t.id);if(!old)return t;return {...old,...t,label:fillCopy(t.label,old.label),value:fillCopy(t.value,old.value),icon:t.icon||old.icon};}):extra.traits;
  const regionalStats={...extra.regionalStats,...c.regionalStats};
  for(const region of ['global','kr','jp','cn'] as const)if(regionalStats[region]||extra.regionalStats?.[region])regionalStats[region]=mergeStats(c.regionalStats?.[region],extra.regionalStats?.[region]);
  const nameSources={...extra.nameSources,...c.nameSources};
  for(const l of locales)if(c.name[l]&&c.name[l]!==extra.name[l]&&!c.nameSources?.[l])delete nameSources[l];
  const variantDetails={...extra.variantDetails};
  for(const [id,v]of Object.entries(c.variantDetails||{})){const old=extra.variantDetails?.[id];variantDetails[id]=old&&old.sourceId===v.sourceId?{...old,...v,stats:mergeStats(v.stats,old.stats),skillTables:v.skillTables?.length?v.skillTables:old.skillTables,sections:v.sections?.length?v.sections:old.sections}:v;}
  return {...extra,...c,detailSources:[...new Map([...(extra.detailSources||[]),...(c.detailSources||[])].map(s=>[s.url,s])).values()].slice(0,40),name:fillCopy(c.name,extra.name),nameSources,traits,
   image:full?extra.image:c.image||extra.image,
   images:[...new Map([...(extra.images||[]),...(c.images||[])].map(a=>[a.url,a])).values()],
   stats:mergeStats(c.stats,extra.stats),statDetailLabel:c.statDetailLabel||extra.statDetailLabel,...c.regionalStatProgression||extra.regionalStatProgression?{regionalStatProgression:{...extra.regionalStatProgression,...c.regionalStatProgression}}:{},...c.regionalSkillTables||extra.regionalSkillTables?{regionalSkillTables:{...extra.regionalSkillTables,...c.regionalSkillTables}}:{},historicalBackground:c.historicalBackground||extra.historicalBackground,...Object.keys(variantDetails).length?{variantDetails}:{},statProgression:c.statProgression||extra.statProgression,statGrowth:c.statGrowth||extra.statGrowth,potentialRewards:c.potentialRewards?.length?c.potentialRewards:extra.potentialRewards,skillTables:c.skillTables?.length?c.skillTables:extra.skillTables,sections:[...new Map([...(extra.sections||[]),...(c.sections||[])].map(s=>[s.id,s])).values()],
   ...(Object.keys(regionalStats).length?{regionalStats}:{})};
}
