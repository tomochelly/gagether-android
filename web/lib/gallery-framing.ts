import runtime from '../content/gallery-framing-runtime.json' with {type:'json'};
import heads from '../content/gallery-protected-heads.json' with {type:'json'};
import {rosterArtUrl} from './roster-art-framing';
export type GallerySubject={left:number;top:number;right:number;bottom:number;width?:number;height?:number};
const compact=runtime as unknown as {prefixes:string[];rows:[number,number,number,number,number|null,number|null][];entries:[number,string,number][];backgrounds:string[]};
const rows:GallerySubject[]=compact.rows.map(([left,top,right,bottom,width,height])=>({left,top,right,bottom,...width!==null?{width}:{},...height!==null?{height}:{}}));
const subjects=new Map(compact.entries.map(([prefix,suffix,index])=>[compact.prefixes[prefix]+suffix,rows[index]]));
export function gallerySubject(url:string):GallerySubject|undefined{return subjects.get(rosterArtUrl(url))||subjects.get(url);}
const backgrounds=new Set(compact.backgrounds);
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

/** Face-first splash preview with room for the original scene and complete head inside either slant. */
export function splashPortraitFrame(image:{width:number;height:number},box:{width:number;height:number},head:ProtectedHead,slant=0,dpr=1){
 if(![image.width,image.height,box.width,box.height,dpr].every(v=>Number.isFinite(v)&&v>0)||head.left<0||head.top<0||head.right>100||head.bottom>100||head.right<=head.left||head.bottom<=head.top)return;
 if(head.width&&head.height&&Math.abs(image.width/image.height-head.width/head.height)/(head.width/head.height)>.025)return;
 const x1=image.width*head.left/100,x2=image.width*head.right/100,y1=image.height*head.top/100,y2=image.height*head.bottom/100;
 const inset=Math.min((box.width-16)/2,Math.max(12,slant+6)),bottom=Math.max(90,box.height*.24),availableWidth=box.width-2*inset,availableHeight=box.height-12-bottom;
 const cover=Math.max(box.width/image.width,box.height/image.height),desired=Math.max(cover,Math.min(box.height*.30/(y2-y1),cover*1.65)),scale=Math.min(desired,availableWidth/(x2-x1),availableHeight/(y2-y1),1/Math.max(1,dpr));if(!(scale>0))return;
 const clamp=(n:number,a:number,b:number)=>Math.min(Math.max(n,a),b),width=image.width*scale,height=image.height*scale;
 let left=box.width/2-(x1+x2)/2*scale,top=box.height*.30-(y1+y2)/2*scale;
 if(width>=box.width)left=clamp(left,box.width-width,0);if(height>=box.height)top=clamp(top,box.height-height,0);
 left=clamp(left,inset-x1*scale,box.width-inset-x2*scale);top=clamp(top,12-y1*scale,box.height-bottom-y2*scale);
 return {left,top,width,height,scale};
}
