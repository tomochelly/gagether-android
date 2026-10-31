import manifest from '../content/nikke-recruit-pool.json' with {type:'json'};
import type {CharacterRoster} from './character-roster';
import {validateRecruitCatalog,type NikkeRecruitCatalog,type NikkeRank} from './nikke-recruit';
/** A fixed reviewed rotation, never all gallery characters or costume images. */
export function createNikkeRecruitCatalog(roster:CharacterRoster):NikkeRecruitCatalog{
 const ids=new Set(manifest.ids),characters=roster.characters.filter(c=>ids.has(c.id)).map(c=>({id:c.id,name:c.name,rank:c.rarityLabel as NikkeRank,image:c.image?.url||'',manufacturer:c.traits?.find(t=>t.id==='manufacturer')?.value.en||''}));
 if(!characters.some(c=>c.id===manifest.featured))characters.push({...manifest.featuredFallback,rank:'SSR'});
 return validateRecruitCatalog({poolId:manifest.id,featured:manifest.featured,name:manifest.name,endsAt:manifest.endsAt,characters,sources:manifest.sources});
}
export async function readNikkeRecruitCatalog(){const {readCharacterRosterView}=await import('./roster-art-framing-store');const roster=await readCharacterRosterView('nikke');if(!roster)throw Error('NIKKE roster unavailable');return createNikkeRecruitCatalog(roster.data);}
