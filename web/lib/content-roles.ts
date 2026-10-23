import type {Entry} from './types';
/** Acquisition pools describe entities; claimable rewards belong to event/update/package records. */
export const allowsRewards=(entry:Pick<Entry,'kind'|'contentRole'>)=>entry.contentRole!=='entity'&&['event','update','package'].includes(entry.kind);
export function separateEntityRewards(entry:Entry):Entry{
 if(allowsRewards(entry)||!entry.rewards?.length&&!Object.values(entry.rewardNote||{}).some(Boolean))return entry;
 const {rewards:_rewards,rewardNote:_note,...entity}=entry;return entity;
}
