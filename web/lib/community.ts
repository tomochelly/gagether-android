import type {Entry,Localized} from './types';
export type CommunityMember={key:string;name:Localized};
// Rotation-scoped: never silently merge different outfits, services or reruns.
export function communityMembers(entry:Entry):CommunityMember[]{
 if(entry.kind!=='pickup'||entry.poolType==='support'||entry.poolType==='weapon')return [];
 const names=entry.pickupMembers?.length?entry.pickupMembers.filter(m=>m.role!=='rate-up').map(m=>m.name):entry.entityDetails?.length?entry.entityDetails.map(p=>p.name):[entry.title];
 const seen=new Set<string>();return names.flatMap(name=>{const key=(name.ko||name.en||name.ja||name.zh||'').normalize('NFC').trim();if(!key||seen.has(key))return [];seen.add(key);return [{key,name}];});
}
export type CommunityReview={id:string;author:string;stars:number;body:string;updatedAt:number;likes:number;liked:boolean;mine:boolean;reported:boolean;reports?:number;revision:number};
export type CommunityData={average:number|null;count:number;comments:number;reviews:CommunityReview[];mine:CommunityReview|null;signedIn:boolean;canModerate:boolean;next:number|null};
export function validReview(body:Record<string,unknown>){return Number.isInteger(body.stars)&&Number(body.stars)>=1&&Number(body.stars)<=5&&typeof body.text==='string'&&body.text.trim().length<=400&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(body.text)&&Number.isSafeInteger(body.revision)&&Number(body.revision)>=0;}
export type CommunitySummary={average:number|null;count:number;comments:number;excerpt:string|null};
