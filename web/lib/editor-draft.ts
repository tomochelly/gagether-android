import {ownerRecurring} from './recurring-schedule';
import type {Entry} from './types';
export function isNewEntry(entries:Entry[],draft:Entry){return !entries.some(e=>e.id===draft.id);}
export function draftProblems(e:Entry):string[]{
 const errors:string[]=[];
 if(!Object.values(e.title||{}).some(v=>v.trim()))errors.push('title: Enter at least one localized title.');
 if(!e.gameId)errors.push('gameId: Select a game.');
 if((!e.sourceUrl&&!ownerRecurring(e))||(!!e.sourceUrl&&!/^https:\/\//.test(e.sourceUrl)))errors.push('sourceUrl: Enter an HTTPS source URL.');
 for(const [i,m] of (e.pickupMembers||[]).entries())if(!Object.values(m.name||{}).some(v=>v.trim()&&(!/^\d+$/.test(v.trim())||e.gameId==='reverse1999'&&['6','37','210'].includes(v.trim()))))errors.push(`pickupMembers.${i}.name: Enter a character or support-card name, not a number.`);
 if(e.selectionCount&&(!(e.pickupMembers||[]).some(m=>m.role==='candidate')||e.selectionCount>(e.pickupMembers||[]).filter(m=>m.role==='candidate').length))errors.push('selectionCount: Set candidate members before entering the number to choose.');
 if(e.startAt&&e.endAt&&Date.parse(e.startAt)>=Date.parse(e.endAt))errors.push('endAt: End must follow start.');
 for(const [i,b] of (e.contentBlocks||[]).entries())if(b.type==='image'&&(!b.asset.image||!b.asset.imageVerified||!b.asset.imageLocale))errors.push(`contentBlocks.${i}.asset: Upload or apply the image, or remove the empty image block.`);
 for(const [i,r] of (e.rewards||[]).entries()){if(!Object.values(r.name).some(v=>v.trim()))errors.push(`rewards.${i}.name: Enter a reward name or select a game item.`);if(!/^https:\/\//.test(r.sourceUrl))errors.push(`rewards.${i}.sourceUrl: Enter an HTTPS evidence URL.`);}
 return errors;
}
