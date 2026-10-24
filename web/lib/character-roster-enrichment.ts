import bootstrap from '../content/character-rosters/bootstrap.json' with {type:'json'};
import artwork from '../content/character-rosters/artwork-manifest.json' with {type:'json'};
import type {CharacterRoster,RosterCharacter} from './character-roster';

const snapshots=new Map((bootstrap as CharacterRoster[]).map(r=>[r.gameId,r]));
const locales=['ko','en','ja','zh'] as const;
function fillCopy(primary:RosterCharacter['name'],extra:RosterCharacter['name']){
 return Object.fromEntries(locales.map(l=>[l,primary[l]||extra[l]])) as RosterCharacter['name'];
}
/** Supplements a sparse source response with exact-ID, source-backed saved facts.
 * New source values win; a missing field is not an instruction to erase facts. */
export function retainCharacterFacts(c:RosterCharacter,extra:RosterCharacter):RosterCharacter{
  const full=extra.image&&extra.image.kind!=='portrait'&&c.image?.kind==='portrait';
  const oldTraits=new Map(extra.traits?.map(t=>[t.id,t])||[]);
  const traits=c.traits?.length?c.traits.map(t=>{const old=oldTraits.get(t.id);if(!old)return t;return {...old,...t,label:fillCopy(t.label,old.label),value:fillCopy(t.value,old.value),icon:t.icon||old.icon};}):extra.traits;
  const regionalStats={...extra.regionalStats,...c.regionalStats};
  for(const region of ['global','kr','jp','cn'] as const)if(!regionalStats[region]?.length&&extra.regionalStats?.[region]?.length)regionalStats[region]=extra.regionalStats[region];
  const nameSources={...extra.nameSources,...c.nameSources};
  for(const l of locales)if(c.name[l]&&c.name[l]!==extra.name[l]&&!c.nameSources?.[l])delete nameSources[l];
  return {...extra,...c,name:fillCopy(c.name,extra.name),nameSources,traits,
   image:full?extra.image:c.image||extra.image,
   images:[...new Map([...(extra.images||[]),...(c.images||[])].map(a=>[a.url,a])).values()],
   stats:c.stats?.length?c.stats:extra.stats,sections:c.sections?.length?c.sections:extra.sections,
   ...(Object.keys(regionalStats).length?{regionalStats}:{})};
}
export function enrichCharacterRoster(data:CharacterRoster):CharacterRoster{
 const reference=snapshots.get(data.gameId);if(!reference)return data;
 const known=new Map(reference.characters.map(c=>[c.id,c]));
 const characters=data.characters.map(c=>{const extra=known.get(c.id);known.delete(c.id);return extra?retainCharacterFacts(c,extra):c;});
 characters.push(...known.values());characters.sort((a,b)=>a.id.localeCompare(b.id,'en',{numeric:true}));
 const pin=(id:string,a:RosterCharacter['image'])=>{if(!a)return a;const saved=artwork.find(s=>s.gameId===data.gameId&&s.characterId===id&&s.url===a.url);return saved?{...a,url:saved.publicUrl}:a;};
 const pinned=characters.map(c=>({...c,image:pin(c.id,c.image),...(c.images?{images:c.images.map(a=>pin(c.id,a)!)}:{})}));
 return {...data,characters:pinned,sourceUrls:[...new Set([...data.sourceUrls,...reference.sourceUrls])].slice(0,40),coverage:{...data.coverage,includedCount:characters.length}};
}
