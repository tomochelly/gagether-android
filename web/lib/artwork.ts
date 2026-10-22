import type {EntityArtwork,PreviewFocus,PreviewBounds,Locale,Region,Entry} from './types';
import {games} from './games';
import {independentService} from './content-audience';
import {artworkPresets} from './artwork-presets';
export function previewFocus(art:EntityArtwork):PreviewFocus{
 return art.previewFocus||artworkPresets[art.image||'']||{x:50,y:art.imageKind==='weapon'?50:art.imageKind?32:50,zoom:art.imageKind==='weapon'?1.15:art.imageKind?1.3:1};
}
export function serviceArtworkLocale(region:Region,gameId?:string):Locale|undefined{
 const game=games.find(g=>g.id===gameId);
 if(game&&!independentService(game,region))return undefined;
 return region==='jp'?'ja':region==='cn'?'zh':game?(region==='kr'?'ko':'en'):undefined;
}
export function artworkForLocale(art:EntityArtwork,locale:Locale,mode:'preview'|'full'='preview',serviceLocale?:Locale):EntityArtwork{
 serviceLocale=serviceLocale||serviceArtworkLocale((art as Entry).region,(art as Entry).gameId);
 const targetLocale=serviceLocale||locale;
 const native=serviceLocale&&art.imageLocale===serviceLocale&&art.imageVerified;
 const translated=native?undefined:art.localizedArtwork?.[targetLocale];
 const selected=translated?.imageVerified?{...art,...translated,previewFocus:art.previewFocus||translated.previewFocus}:art;
 const preview=art.previewArtwork;
 if(mode==='preview'&&preview?.imageVerified&&(preview.imageLocale==='neutral'||preview.imageLocale===targetLocale))return {...preview,previewFocus:art.previewFocus||preview.previewFocus,previewBounds:art.previewBounds||preview.previewBounds};
 // Selected independent JP/CN services keep their own reviewed current original.
 // Shared services still require the visitor language or verified neutral artwork.
 if(!selected.imageVerified||!selected.imageLocale||selected.imageLocale!=='neutral'&&selected.imageLocale!==targetLocale)return {...selected,image:undefined,imageVerified:false};
 return selected;
}
export function previewGeometry(image:{width:number;height:number},box:{width:number;height:number},focus:PreviewFocus,pixelRatio=1,bounds:PreviewBounds={left:0,top:0,right:100,bottom:100},anchorX=.5){
 const cropWidth=image.width*(bounds.right-bounds.left)/100,cropHeight=image.height*(bounds.bottom-bounds.top)/100;
 const cover=Math.max(box.width/cropWidth,box.height/cropHeight);
 // Never manufacture detail by enlarging the original beyond its native pixels.
 const scale=Math.min(cover*focus.zoom,1/Math.max(1,pixelRatio));
 const width=image.width*scale,height=image.height*scale;
 const visibleWidth=cropWidth*scale,visibleHeight=cropHeight*scale;
 const x=(focus.x-bounds.left)/(bounds.right-bounds.left),y=(focus.y-bounds.top)/(bounds.bottom-bounds.top);
 const left=visibleWidth<box.width?(anchorX===.5?(box.width-visibleWidth)/2:Math.max(0,Math.min(box.width-visibleWidth,box.width*anchorX-visibleWidth*x))):Math.max(box.width-visibleWidth,Math.min(0,box.width*anchorX-visibleWidth*x));
 const top=visibleHeight<box.height?(box.height-visibleHeight)/2:Math.max(box.height-visibleHeight,Math.min(0,box.height*.38-visibleHeight*y));
 return {width,height,left:left-width*bounds.left/100,top:top-height*bounds.top/100,clipPath:`inset(${bounds.top}% ${100-bounds.right}% ${100-bounds.bottom}% ${bounds.left}%)`};
}

/** Bring native-sized posters toward the copy on wide headers, without enlarging them. */
export function versionPreviewAnchor(image:{width:number;height:number},box:{width:number;height:number},pixelRatio=1){
 const nativeWidth=image.width/Math.max(1,pixelRatio);
 return box.width>1200&&nativeWidth<box.width*.78?.64:box.width>600?.8:.5;
}

// Blend the visible image boundary, which can sit inside its container at native resolution.
export function previewSurface(image:{width:number;height:number;left:number;top:number},box:{width:number;height:number},bounds:PreviewBounds={left:0,top:0,right:100,bottom:100}){
 const left=Math.max(0,image.left+image.width*bounds.left/100);
 const top=Math.max(0,image.top+image.height*bounds.top/100);
 const right=Math.min(box.width,image.left+image.width*bounds.right/100);
 const bottom=Math.min(box.height,image.top+image.height*bounds.bottom/100);
 const width=Math.max(0,right-left),height=Math.max(0,bottom-top);
 return {left,top,width,height,imageLeft:image.left-left,imageTop:image.top-top,
  fadeLeft:Math.min(72,width*.12),fadeRight:right<box.width-1?Math.min(28,width*.06):0,
  fadeTop:top>1?Math.min(28,height*.1):0,fadeBottom:bottom<box.height-1?Math.min(28,height*.1):0};
}

export function textOnlyEntry(entry:Entry,locale:Locale,mode:'preview'|'full'='preview'){
 if(entry.kind!=='event'&&entry.kind!=='package'&&entry.kind!=='update')return false;
 const art=artworkForLocale(entry,locale,mode,serviceArtworkLocale(entry.region,entry.gameId));
 return !art.image||!art.imageVerified;
}

/** An original may be registered in several locale slots; display it only once. */
export function detailArtworkForLocale(entry:Entry,locale:Locale){
 const primary=artworkForLocale(entry,locale,'full').image;
 const seen=new Set(primary?[primary]:[]);
 return (entry.detailImages||[]).filter(art=>{
  const selected=artworkForLocale(art,locale,'full',serviceArtworkLocale(entry.region,entry.gameId));
  if(!selected.image||seen.has(selected.image))return false;
  seen.add(selected.image);return true;
 });
}
