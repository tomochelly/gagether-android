import icons from '../content/pickup-member-icons.json' with {type:'json'};
import type {GameIcon,Localized} from './types';
import {samePickupName} from './pickup-detail';
export function pickupMemberIcon(gameId:string,name:Localized):GameIcon|undefined{
 return icons.find(row=>row.gameId===gameId&&row.imageLocale==='neutral'&&row.names.some(alias=>samePickupName(alias,name)))?.icon;
}
