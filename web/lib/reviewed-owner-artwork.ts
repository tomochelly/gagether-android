import repairs from '../content/reviewed-owner-artwork-repairs.json' with {type:'json'};
import type {ArtworkAsset,Entry} from './types';
import {isolatedArtwork} from './editor-artwork';

/** Apply the owner's newer artwork request only to the exact superseded edit.
 * Stored owner history is retained; a later owner revision always wins. */
export function repairSupersededOwnerArtwork(entry:Entry):Entry{
 const rule=repairs.find(r=>r.id===entry.id&&r.gameId===entry.gameId&&r.region===entry.region&&r.revision===entry.editor?.revision&&r.updatedAt===entry.editor?.updatedAt&&r.previousImage===entry.image&&r.previousLocale===entry.imageLocale);
 if(!rule)return entry;
 const asset=rule.asset as ArtworkAsset;
 if(!entry.pickupMembers?.some(m=>m.image===asset.image&&m.imageLocale==='neutral'&&m.imageVerified&&m.imageSource===asset.imageSource))return entry;
 return {...entry,...isolatedArtwork(entry,asset),imageFit:'contain',localizedArtwork:Object.fromEntries(['ko','en','ja','zh'].map(l=>[l,asset]))};
}
