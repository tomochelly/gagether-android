import type {RosterCharacter} from './character-roster';

/** Old persisted reward metadata must not hide a newly verified exact original. */
export function retainEndfieldPotentialRewardArt(current:RosterCharacter,reference:RosterCharacter):RosterCharacter{
 if(current.id!==reference.id||!current.potentialRewards?.length)return current;
 const known=new Map(reference.potentialRewards?.map(reward=>[reward.id,reward])||[]);
 const potentialRewards=current.potentialRewards.map(reward=>{
  const extra=known.get(reward.id);
  if(reward.image||!extra?.image||reward.level!==extra.level||reward.type!==extra.type||reward.sourceUrl!==extra.sourceUrl||reward.sourceKind!==extra.sourceKind)return reward;
  if((['ko','en','ja','zh'] as const).some(locale=>reward.title[locale]&&extra.title[locale]&&reward.title[locale]!==extra.title[locale]))return reward;
  return {...reward,image:extra.image};
 });
 return {...current,potentialRewards};
}
