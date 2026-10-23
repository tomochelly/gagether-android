import type {EntityArtwork,ImageFrame,ImageFrameKind} from './types';
/** Owner placement is a center point in the destination box, not a destructive crop. */
export function imageFrame(art:EntityArtwork,kind:ImageFrameKind){return art.imageFraming?.[kind]||(kind==='mobile'?art.imageFraming?.banner:undefined)||art.imageFraming?.default;}
export function frameGeometry(image:{width:number;height:number},box:{width:number;height:number},frame:ImageFrame,pixelRatio=1){
 const base=(frame.fit==='contain'?Math.min:Math.max)(box.width/image.width,box.height/image.height);
 const requested=base*frame.zoom,scale=requested;
 const width=image.width*scale,height=image.height*scale;
 return {width,height,left:box.width*frame.x/100-width/2,top:box.height*frame.y/100-height/2,limited:requested>1/Math.max(1,pixelRatio)+.00001};
}
export function moveFrame(frame:ImageFrame,dx:number,dy:number):ImageFrame{return {...frame,x:Math.max(-100,Math.min(200,Math.round((frame.x+dx)*100)/100)),y:Math.max(-100,Math.min(200,Math.round((frame.y+dy)*100)/100))};}
export type FrameBox={kind:ImageFrameKind;width:number;height:number;banner?:boolean|'version'};
