import framing from '../content/wuwa-reference-framing.json' with {type:'json'};
export type SubjectBounds={left:number;top:number;right:number;bottom:number};
export function subjectBounds(hash?:string):SubjectBounds|undefined{return hash?(framing.entries as Record<string,SubjectBounds>)[hash]:undefined;}
/** Fit the complete checked subject, crop only surrounding scene, and respect original device pixels. */
export function referenceSubjectFrame(image:{width:number;height:number},viewport:{width:number;height:number},bounds?:SubjectBounds,dpr=1){
 if(![image.width,image.height,viewport.width,viewport.height,dpr].every(n=>Number.isFinite(n)&&n>0))return undefined;
 const b=bounds||{left:0,top:0,right:100,bottom:100};
 if(![b.left,b.top,b.right,b.bottom].every(Number.isFinite)||b.left<0||b.top<0||b.right>100||b.bottom>100||b.right<=b.left||b.bottom<=b.top)return undefined;
 const x=image.width*b.left/100,y=image.height*b.top/100,w=image.width*(b.right-b.left)/100,h=image.height*(b.bottom-b.top)/100;
 // Breathing room keeps hair, hands and shoes clear of the visual frame edge.
 const safeWidth=viewport.width*.94,safeHeight=viewport.height*.96,scale=Math.min(safeWidth/w,safeHeight/h,1/Math.max(1,dpr));
 return {width:image.width*scale,height:image.height*scale,left:(viewport.width-w*scale)/2-x*scale,top:(viewport.height-h*scale)/2-y*scale,scale};
}
