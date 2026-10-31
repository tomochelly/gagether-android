import type {Entry,Localized} from './types';
import {featuredMembers} from './presentation';
import {pickupCards} from './pickup-cards';
import aliases from '../content/entity-profile-aliases.json' with {type:'json'};
import {samePickupName} from './pickup-names';
import {bluearchivePickupArtwork} from './bluearchive-pickup-artwork';
export {samePickupName} from './pickup-names';

export type OpenEntry=(entry:Entry,member?:Localized)=>void;
export function pickupDetailMembers(entry:Entry){
 return entry.kind==='pickup'&&!entry.selectionCount?featuredMembers(entry)||[]:[];
}
/** A display projection only. The canonical record remains the editor and fetch target. */
export function pickupDetailEntry(original:Entry,requested?:Localized|null):Entry{
 const entry=bluearchivePickupArtwork(original);
 if(entry.kind!=='pickup'||entry.selectionCount)return entry;
 const members=pickupDetailMembers(entry),member=members.find(m=>requested&&samePickupName(m.name,requested))||members[0];
 const name=member?.name||entry.title;
 const display=member?(pickupCards([entry]).find(c=>samePickupName(c.display.title,name))?.display||entry):entry;
 const matches=(profile:NonNullable<Entry['entityDetails']>[number])=>samePickupName(profile.name,name)||aliases.some(row=>row.gameId===entry.gameId&&row.profileId===profile.id&&row.regions.includes(entry.region)&&row.names.some(alias=>samePickupName(alias,name)));
 return {...display,title:name,pickupMembers:member?[member]:undefined,entityDetails:entry.entityDetails?.filter(matches),videos:entry.videos?.filter(v=>v.kind==='character'&&(v.entityNames?.some(n=>samePickupName(n,name))||members.length<=1&&!v.entityNames?.length))};
}
