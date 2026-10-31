import type {RewardItem} from './types';
import {rewardCatalog,type RewardDefinition} from './reward-catalog';
export function gameRewardChoices(gameId:string){return rewardCatalog.filter(r=>r.gameId===gameId);}
/** Catalog provenance describes the item/icon; reward eligibility still cites the entry. */
export function selectReward(definition:RewardDefinition,previous:RewardItem):RewardItem{
 return {...previous,rewardId:definition.id,category:definition.category,name:{...definition.name},icon:definition.icon,officialLocales:definition.officialLocales||[],translatedLocales:definition.translatedLocales||[]};
}
