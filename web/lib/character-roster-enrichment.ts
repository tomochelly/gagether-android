import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
import artwork from '../content/character-rosters/artwork-manifest.json' with {type:'json'};
import {cleanRosterArt} from './character-roster-art-guard';
import {pinRosterFactIcons} from './roster-detail-icons';
import type {CharacterRoster,RosterCharacter} from './character-roster';

const snapshots=new Map((bootstrap as CharacterRoster[]).map(r=>[r.gameId,r]));
const locales=['ko','en','ja','zh'] as const;
function invalidReversePanel(c:RosterCharacter){
 return c.stats?.some(s=>['hp','atk','reality_def','mental_def'].includes(s.id)&&(!Number.isFinite(Number(s.value))||Number(s.value)>100000||Number(s.value)<0))||false;
}
function cleanReverseStats(c:RosterCharacter):RosterCharacter{
 const number=(id:string)=>{const s=c.stats?.find(s=>s.id===id);return s?Number(s.value.replace('%','').trim()):NaN;};
 // A 0/0 critical pair in the source is a missing optional panel, not a
 // character with zero basic critical damage. Other valid facts remain.
 return number('crit_rate')===0&&number('crit_dmg')===0?{...c,stats:c.stats?.filter(s=>!['crit_rate','crit_dmg'].includes(s.id))}:c;
}
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
   stats:mergeStats(c.stats,extra.stats),...Object.keys(variantDetails).length?{variantDetails}:{},statProgression:c.statProgression||extra.statProgression,statGrowth:c.statGrowth||extra.statGrowth,potentialRewards:c.potentialRewards?.length?c.potentialRewards:extra.potentialRewards,skillTables:c.skillTables?.length?c.skillTables:extra.skillTables,sections:[...new Map([...(extra.sections||[]),...(c.sections||[])].map(s=>[s.id,s])).values()],
   ...(Object.keys(regionalStats).length?{regionalStats}:{})};
}
export function enrichCharacterRoster(data:CharacterRoster):CharacterRoster{
 const reference=snapshots.get(data.gameId);if(!reference)return data;
 const known=new Map(reference.characters.map(raw=>{const c=data.gameId==='reverse1999'?cleanReverseStats(raw):raw;return [c.id,data.gameId==='reverse1999'&&invalidReversePanel(c)?{...c,stats:undefined}:c];}));
 const characters=data.characters.map(raw=>{
  let c=data.gameId==='reverse1999'?cleanReverseStats(raw):raw;
  if(data.gameId==='hsr'&&/^80(?:0[1-9]|10)$/.test(c.id)&&Object.values(c.name).some(v=>v.includes('{NICKNAME}'))){
   const path=c.traits?.find(t=>t.id==='path')?.value;const headings={ko:'개척자',en:'Trailblazer',ja:'開拓者',zh:'开拓者'};
   c={...c,name:{...c.name}};for(const l of locales)if(c.name[l].includes('{NICKNAME}'))c.name[l]=headings[l]+(path?.[l]?' · '+path[l]:'');
  }
  const reference=known.get(c.id),extra=data.gameId==='reverse1999'&&reference?cleanReverseStats(reference):reference;known.delete(c.id);
  // A bad upstream identity join can contaminate both the localized name and
  // the whole panel. Use only this exact source ID's valid reference facts.
  if(data.gameId==='reverse1999'&&invalidReversePanel(c))c={...c,...extra?{name:fillCopy(extra.name,c.name),nameSources:{...c.nameSources,...extra.nameSources}}:{},stats:extra?.stats};
  return extra?retainCharacterFacts(c,extra):c;
 });
 characters.push(...known.values());characters.sort((a,b)=>a.id.localeCompare(b.id,'en',{numeric:true}));
 const pin=(id:string,a:RosterCharacter['image'])=>{if(!a)return a;const saved=artwork.find(s=>s.gameId===data.gameId&&s.characterId===id&&s.url===a.url);return saved?{...a,url:saved.publicUrl}:a;};
 const pinned=characters.map(c=>pinRosterFactIcons({...c,image:pin(c.id,c.image),...(c.images?{images:c.images.map(a=>pin(c.id,a)!)}:{})},data.gameId));
 return {...data,characters:pinned,sourceUrls:[...new Set([...data.sourceUrls,...reference.sourceUrls])].slice(0,40),coverage:{...data.coverage,includedCount:characters.length}};
}
