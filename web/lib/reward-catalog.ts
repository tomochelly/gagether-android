import type {GameIcon,Localized,Locale,RewardItem} from './types';
import manifest from '../content/reward-catalog.json' with {type:'json'};
export interface RewardDefinition {sourceKind?:'official'|'community';gameId:string;id:string;name:Localized;aliases:string[];category:'gacha-currency'|'gacha-ticket'|'resource';icon?:GameIcon;officialLocales?:Locale[];translatedLocales?:Locale[];sourceUrls:string[]}
export const rewardCatalog=manifest as RewardDefinition[];
const normalize=(s:string)=>s.normalize('NFKC').trim().toLocaleLowerCase().replace(/[\s·ㆍ・]/g,'');
export function rewardDefinition(gameId:string,reward:RewardItem){return rewardCatalog.find(r=>r.gameId===gameId&&(reward.rewardId?r.id===reward.rewardId:[...Object.values(r.name),...r.aliases].some(name=>Object.values(reward.name).some(value=>!!value&&normalize(value)===normalize(name)))));}
export const rewardIcon=(gameId:string,reward:RewardItem)=>reward.icon||rewardDefinition(gameId,reward)?.icon;
