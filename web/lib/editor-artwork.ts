import type {ArtworkAsset,EntityArtwork,Locale} from './types';
import {replacementArtwork} from './editor-preview';
export type ArtworkSlot=Locale|'neutral';
export const artworkFields=['image','imageSource','imageVerified','imageKind','imageLocale','imageCaption','imageFraming','previewFocus','previewBounds','textFreePreview','originalLanguageFallback','imageFit','imagePosition','previewArtwork'] as const;
/** Image-specific metadata must never leak from a different original. */
export function isolatedArtwork(base:EntityArtwork,asset:EntityArtwork):EntityArtwork{
 const cleared=Object.fromEntries(artworkFields.map(k=>[k,undefined]));
 return {...base,...cleared,...asset,localizedArtwork:undefined};
}
/** The editor selects an exact language slot, without retagging the saved image. */
export function editingArtwork(value:EntityArtwork,slot:ArtworkSlot):EntityArtwork{
 const asset=slot!=='neutral'?value.localizedArtwork?.[slot]:undefined;
 if(asset)return isolatedArtwork(value,asset);
 if(value.imageLocale===slot)return isolatedArtwork(value,{...value,localizedArtwork:undefined});
 return isolatedArtwork(value,{imageLocale:slot});
}
export function assetFromArtwork(value:EntityArtwork,size:{width:number;height:number},verifiedAt:string):ArtworkAsset{
 return Object.fromEntries([...artworkFields.filter(k=>!['imageFit','imagePosition','previewArtwork'].includes(k)).map(k=>[k,value[k]]),['image',value.image||''],['imageSource',value.imageSource||'https://gagether.wiki'],['imageVerified',!!value.imageVerified],['width',size.width],['height',size.height],['verifiedAt',verifiedAt]]) as unknown as ArtworkAsset;
}
/** Locale writes affect one slot only. Explicit empty slots suppress root fallbacks. */
export function patchArtworkSlot(value:EntityArtwork,slot:ArtworkSlot,patch:Partial<EntityArtwork>,size?:{width:number;height:number},rootBackup?:ArtworkAsset):Partial<EntityArtwork>{
 if(slot==='neutral'){
  const localizedArtwork={...value.localizedArtwork};
  if(rootBackup&&rootBackup.imageLocale&&rootBackup.imageLocale!=='neutral'&&!localizedArtwork[rootBackup.imageLocale])localizedArtwork[rootBackup.imageLocale]=rootBackup;
  return {...patch,imageLocale:'neutral',localizedArtwork};
 }
 const current=editingArtwork(value,slot),previous=value.localizedArtwork?.[slot];
 const asset=assetFromArtwork({...current,...patch,imageLocale:slot},size||previous||{width:1,height:1},previous?.verifiedAt||new Date().toISOString());
 return {localizedArtwork:{...value.localizedArtwork,[slot]:asset}};
}
export function replaceArtworkSlot(value:EntityArtwork,slot:ArtworkSlot,image:string,origin:string,size:{width:number;height:number},rootBackup?:ArtworkAsset){
 const {localizedArtwork:_discard,...patch}=replacementArtwork(image,origin,slot);
 const result=patchArtworkSlot(value,slot,patch,size,rootBackup);
 if(slot!=='neutral'&&result.localizedArtwork?.[slot])result.localizedArtwork[slot]!.verifiedAt=new Date().toISOString();
 return result;
}
