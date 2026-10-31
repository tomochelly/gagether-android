import type {ImageFrame,PreviewFocus} from './types';
import {frameGeometry} from './image-framing';
export type ThumbnailHead={left:number;top:number;right:number;bottom:number;width?:number;height?:number};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
/** Thumbnail-only cover placement. Exact owner frames win; full/detail artwork is untouched. */
export function fillThumbnailFrame(image:{width:number;height:number},box:{width:number;height:number},head?:ThumbnailHead,focus?:PreviewFocus,manual?:ImageFrame){
 if(![image.width,image.height,box.width,box.height].every(v=>Number.isFinite(v)&&v>0))return;
 if(manual)return frameGeometry(image,box,manual);
 const valid=head&&[head.left,head.top,head.right,head.bottom].every(Number.isFinite)&&head.left>=0&&head.top>=0&&head.right<=100&&head.bottom<=100&&head.right>head.left&&head.bottom>head.top&&(!head.width||!head.height||Math.abs(image.width/image.height-head.width/head.height)/(head.width/head.height)<.025);
 const cover=Math.max(box.width/image.width,box.height/image.height);
 if(!valid){const scale=cover*Math.max(1,focus?.zoom||1),width=image.width*scale,height=image.height*scale;return{width,height,left:clamp(box.width*.5-width*(focus?.x??50)/100,Math.min(0,box.width-width),0),top:clamp(box.height*.28-height*(focus?.y??20)/100,Math.min(0,box.height-height),0)};}
 const h=head!,x1=image.width*h.left/100,x2=image.width*h.right/100,y1=image.height*h.top/100,y2=image.height*h.bottom/100;
 const padding=Math.min(6,box.width*.02),caption=Math.min(54,box.height*.17),maxHead=Math.min((box.width-padding*2)/(x2-x1),(box.height-caption-padding)/(y2-y1));
 // A very wide face/hat envelope can exceed a narrow tile. Keep the image covering
 // the tile in that case; reducing below cover would expose top/bottom gutters.
 const scale=Math.max(cover,Math.min(Math.max(cover,box.height*.52/(y2-y1)),maxHead)),width=image.width*scale,height=image.height*scale;
 const position=(wanted:number,imageSize:number,boxSize:number,start:number,end:number,after:number)=>{const coverLow=Math.min(0,boxSize-imageSize),coverHigh=Math.max(0,boxSize-imageSize),low=Math.max(coverLow,padding-start*scale),high=Math.min(coverHigh,boxSize-after-end*scale);return low<=high?clamp(wanted,low,high):clamp(wanted,coverLow,coverHigh);};
 return{width,height,left:position(box.width*.5-(x1+x2)/2*scale,width,box.width,x1,x2,padding),top:position(box.height*.28-(y1+y2)/2*scale,height,box.height,y1,y2,caption)};
}
/** Balanced rows contain every candidate; an incomplete last row never leaves an empty cell. */
export function thumbnailRows(count:number){if(count<=0)return[];const columns=count<=3?count:Math.ceil(Math.sqrt(count)),rows=Math.ceil(count/columns),base=Math.floor(count/rows),extra=count%rows;return Array.from({length:rows},(_,i)=>base+Number(i<extra));}
