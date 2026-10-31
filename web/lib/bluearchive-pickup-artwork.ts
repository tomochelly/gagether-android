import {maintainedArtwork} from './maintained-artwork';
import {samePickupName} from './pickup-names';
import type {Entry,EntityArtwork,Localized,ArtworkAsset} from './types';

/** Read-only view: exact service/outfit full bodies replace text posters, while
 * the saved rotation and original posters remain the edit/source target. */
export function bluearchivePickupArtwork(entry:Entry):Entry{
 if(entry.gameId!=='bluearchive'||entry.kind!=='pickup')return entry;
 const definitions=maintainedArtwork.filter(d=>d.gameId===entry.gameId&&d.kind===entry.kind&&d.regions.includes(entry.region)&&d.asset.imageVerified&&d.asset.imageLocale==='neutral'&&d.asset.imageKind==='character');
 if(!definitions.length)return entry;
 let changed=false;
 function full<T extends EntityArtwork>(base:T,name:Localized):T{
  const asset=definitions.find(d=>d.names.some(n=>samePickupName(n,name)))?.asset;
  if(!asset)return base;
  changed=true;
  const frame={x:50,y:50,zoom:1,fit:'contain' as const};
  const complete:ArtworkAsset={...asset,imageFraming:{default:frame,banner:frame,card:frame,mobile:frame}};
  const {width:_w,height:_h,verifiedAt:_at,...fields}=complete;
  return {...base,...fields,imageFit:'contain',previewArtwork:undefined,previewBounds:undefined,previewFocus:undefined,textFreePreview:true,originalLanguageFallback:false,localizedArtwork:Object.fromEntries(['ko','en','ja','zh'].map(l=>[l,complete]))};
 }
 const members=entry.pickupMembers?.map(m=>full(m,m.name));
 const featured=members?.filter(m=>m.role!=='rate-up'&&m.role!=='candidate');
 const root=full(entry,featured?.length===1?featured[0].name:entry.title);
 return changed?{...root,...members?{pickupMembers:members}:{}}:entry;
}
