import type {RosterCharacter} from './character-roster';
/** Announced identities are previews, never published beta combat panels. */
export function announcedCharacterPreview(c:RosterCharacter):RosterCharacter{
 if(c.availability?.status!=='announced')return c;
 const {materialGroups,stats,regionalStats,sections,statProgression,statGrowth,skillTables,variantDetails,potentialRewards,historicalBackground,regionalStatProgression,regionalSkillTables,statDetailLabel,...preview}=c;
 const officialIntroduction=c.sourceKind==='official'?sections?.filter(s=>s.id==='official-introduction'):undefined;
 return {...preview,...officialIntroduction?.length?{sections:officialIntroduction}:{},detailSources:c.detailSources?.filter(s=>s.kind==='official')};
}
