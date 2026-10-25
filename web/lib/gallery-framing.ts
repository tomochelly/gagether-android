import audit from '../content/gallery-subject-bounds.json' with {type:'json'};
import heads from '../content/gallery-protected-heads.json' with {type:'json'};
import {rosterArtUrl} from './roster-art-framing';
export type GallerySubject={left:number;top:number;right:number;bottom:number;width?:number;height?:number};
export function gallerySubject(url:string):GallerySubject|undefined{return (audit.entries as Record<string,GallerySubject>)[rosterArtUrl(url)]||(audit.entries as Record<string,GallerySubject>)[url];}
const backgrounds=new Set(audit.knownBackgroundURLs);
export function galleryBackground(url:string){return backgrounds.has(rosterArtUrl(url))||backgrounds.has(url);}
export type ProtectedHead=GallerySubject&{composition?:GallerySubject};
export function galleryProtectedHead(url:string):ProtectedHead|undefined{return (heads.entries as Record<string,ProtectedHead>)[url];}
/** The complete transparent subject fits inside both slant directions, including cached/resized images. */
export function safeGalleryFrame(image:{width:number;height:number},box:{width:number;height:number},bounds?:GallerySubject,slant=0,dpr=1,scaleLimit=Infinity){
 if(![image.width,image.height,box.width,box.height,dpr].every(v=>Number.isFinite(v)&&v>0))return;
 const b=bounds||{left:0,top:0,right:100,bottom:100};if(b.left<0||b.top<0||b.right>100||b.bottom>100||b.right<=b.left||b.bottom<=b.top)return;
 const x=image.width*b.left/100,y=image.height*b.top/100,w=image.width*(b.right-b.left)/100,h=image.height*(b.bottom-b.top)/100;
 const inset=Math.min((box.width-16)/2,Math.max(8,slant+6)),top=Math.max(9,box.height*.035),bottom=Math.min(76,box.height*.22),availableWidth=box.width-2*inset,availableHeight=box.height-top-bottom;
 const scale=Math.min(availableWidth/w,availableHeight/h,1/Math.max(1,dpr),scaleLimit);if(scale<=0)return;
 return {left:(box.width-w*scale)/2-x*scale,top:top+Math.max(0,(availableHeight-h*scale)*.32)-y*scale,width:image.width*scale,height:image.height*scale,scale};
}
/** Reviewed wide poses may crop peripheral wings/props while the entire head stays inside both cuts. */
export function safePortraitFrame(image:{width:number;height:number},box:{width:number;height:number},subject:GallerySubject,head:ProtectedHead,slant=0,dpr=1){
 const full=safeGalleryFrame(image,box,subject,slant,dpr);if(!full)return;
 const span=Math.min(100,Math.max((head.right-head.left)*1.25,(subject.right-subject.left)*.52)),center=(head.left+head.right)/2,left=Math.max(0,Math.min(100-span,center-span/2));
 const raw=head.composition||{left,top:Math.min(subject.top,head.top),right:left+span,bottom:subject.bottom},context={left:Math.min(raw.left,head.left),top:Math.min(raw.top,head.top),right:Math.max(raw.right,head.right),bottom:Math.max(raw.bottom,head.bottom)};
 return safeGalleryFrame(image,box,context,slant,dpr,full.scale*2.25)||full;
}
