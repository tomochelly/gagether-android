import definitions from '../content/maintained-artwork.json' with {type:'json'};
import {samePickupName} from './pickup-detail';
import type {ArtworkAsset,EntityArtwork,Entry,Localized,SourceKind} from './types';
export type MaintainedArtwork={gameId:string;regions:string[];kind:string;names:Localized[];asset:ArtworkAsset;sourceKind:SourceKind};
export const maintainedArtwork=definitions as MaintainedArtwork[];
/** Exact entity/outfit/service originals fill omissions only, never replace owner or reviewed art. */
export function applyMaintainedArtwork(entry:Entry):Entry{
 const defs=maintainedArtwork.filter(d=>d.gameId===entry.gameId&&d.kind===entry.kind&&d.regions.includes(entry.region));
 if(!defs.length)return entry;let changed=false;const used:MaintainedArtwork[]=[];
 function fill<T extends EntityArtwork>(art:T,name:Localized):T{
  let next={...art};for(const def of defs.filter(d=>d.names.some(n=>samePickupName(n,name)))){
   const asset=def.asset,l=asset.imageLocale;
   if(l==='neutral'){
    if(next.image&&next.imageVerified)continue;
    const {width:_w,height:_h,verifiedAt:_at,...fields}=asset;next={...next,...fields};
   }else if(l){if(next.localizedArtwork?.[l]?.imageVerified||next.imageVerified&&next.image&&(next.imageLocale===l||next.imageLocale==='neutral'))continue;next={...next,localizedArtwork:{...next.localizedArtwork,[l]:asset}};}
   else continue;changed=true;used.push(def);
  }return next;
 }
 const members=entry.pickupMembers?.map(m=>m.role==='rate-up'||m.role==='candidate'?m:fill(m,m.name));
 const featured=members?.filter(m=>m.role!=='rate-up'&&m.role!=='candidate');
 let result=fill(entry,featured?.length===1?featured[0].name:entry.title);if(members)result={...result,pickupMembers:members};
 if(!changed)return entry;
 const related=[...entry.relatedSources||[]];for(const d of used)if(!related.some(r=>r.url===d.asset.imageSource)&&related.length<20)related.push({kind:d.sourceKind,url:d.asset.imageSource,title:d.asset.imageCaption?.ko||'Artwork'});
 return {...result,relatedSources:related};
}
