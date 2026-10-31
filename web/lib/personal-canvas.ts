import {type CanvasFrame,type PersonalLayout,type SectionSize} from './personal-layout';
import type {SectionId} from './site-layout';
export const defaultColumns=(id:SectionId)=>id==='content'?8:id==='deadlines'?4:12;
export function clampFrame(frame:CanvasFrame,canvasWidth:number):CanvasFrame{
 const width=Math.round(Math.max(180,Math.min(canvasWidth,frame.width)));
 return {x:Math.round(Math.max(0,Math.min(canvasWidth-width,frame.x))),y:Math.round(Math.max(0,Math.min(100000,frame.y))),width};
}
export function moveCanvas(frame:CanvasFrame,dx:number,dy:number,width:number){return clampFrame({...frame,x:frame.x+dx,y:frame.y+dy},width);}
export function resizeCanvas(frame:CanvasFrame,height:number,dx:number,dy:number,width:number){return {frame:clampFrame({...frame,width:Math.min(width-frame.x,frame.width+dx)},width),height:Math.round(Math.max(180,Math.min(2400,height+dy)))};}
export type CanvasMeasurement={x:number;y:number;width:number;height:number};
/** Preserve actual rendered positions on first edit, rather than repacking existing choices. */
export function captureCanvas(layout:PersonalLayout,measurements:Partial<Record<SectionId,CanvasMeasurement>>,width:number):PersonalLayout{
 const canvasWidth=Math.max(240,Math.min(6000,Math.round(width))),sections={...layout.sections};
 for(const [id,m]of Object.entries(measurements) as [SectionId,CanvasMeasurement][]){if(m.height>0)sections[id]={...sections[id],frame:clampFrame({x:m.x,y:m.y,width:m.width},canvasWidth)};}
 return {...layout,canvas:{width:canvasWidth},sections};
}
export function arrangeCanvas(layout:PersonalLayout,order:SectionId[],width:number,heights:Partial<Record<SectionId,number>>,defaults=false):PersonalLayout{
 const sections:PersonalLayout['sections']=defaults?{}:{...layout.sections};let x=0,y=0,rowHeight=0;
 for(const id of order){
  const size=defaults?{}:sections[id];if(size?.hidden)continue;
  const w=Math.max(180,Math.min(width,defaults?Math.round(width*defaultColumns(id)/12-((defaultColumns(id)<12)?12:0)):size?.frame?.width||width));
  if(x&&x+w>width){x=0;y+=rowHeight+24;rowHeight=0;}
  sections[id]={...size,frame:{x,y,width:w}};const h=size?.height||heights[id]||0;
  if(h>0){x+=w+24;rowHeight=Math.max(rowHeight,h);}
 }
 return {...(defaults?{order:[]}:layout),canvas:{width},sections};
}
export function canvasFrameFor(layout:PersonalLayout,id:SectionId,index:number,heightMap:Partial<Record<SectionId,number>>,sequence?:readonly SectionId[]):CanvasFrame{
 const width=layout.canvas?.width||1040,existing=layout.sections[id]?.frame;if(existing)return existing;
 // Newly appearing sections remain reachable below placed content without moving it.
 const bottom=Math.max(0,...Object.entries(layout.sections).map(([key,s])=>!s?.frame||s.hidden?0:s.frame.y+(heightMap[key as SectionId]??s.height??0)));
 const preceding=sequence?.slice(0,sequence.indexOf(id)).filter(key=>!layout.sections[key]?.frame&&!layout.sections[key]?.hidden)||[];
 const gap=sequence?preceding.reduce((sum,key)=>{const h=heightMap[key]??layout.sections[key]?.height??320;return sum+(h>0?h+24:0);},0):index*344;
 return {x:0,y:Math.min(100000,bottom+24+gap),width};
}
export function raiseCanvas(layout:PersonalLayout,id:SectionId,front=true):PersonalLayout{
 const layers=Object.values(layout.sections).map(s=>s?.layer||0),sections={...layout.sections};
 if(Math.max(0,...layers)>=9999){for(const [i,[key,v]]of Object.entries(sections).sort((a,b)=>(a[1]?.layer||0)-(b[1]?.layer||0)).entries())sections[key as SectionId]={...v,layer:i+1};}
 if(!front){for(const key of Object.keys(sections)as SectionId[])sections[key]={...sections[key],layer:(sections[key]?.layer||0)+1};}
 sections[id]={...sections[id],layer:front?Math.max(0,...Object.values(sections).map(s=>s?.layer||0))+1:0};return {...layout,sections};
}
export function setCanvasSection(layout:PersonalLayout,id:SectionId,patch:SectionSize){return {...layout,sections:{...layout.sections,[id]:{...layout.sections[id],...patch}}};}

/** Default flow captured on an earlier screen can stay responsive without rewriting private XY data.
 * Moved/layered/custom-width canvases retain their exact free positioning. */
export function capturedFlowOrder(layout:PersonalLayout,ids:readonly SectionId[]):SectionId[]|undefined{
 const width=layout.canvas?.width;if(!width||!ids.length)return;
 const framed=ids.filter(id=>layout.sections[id]?.frame);if(!framed.length)return;
 for(const id of framed){const size=layout.sections[id],f=size!.frame!;if(size?.layer)return;
  if(f.x<=2&&Math.abs(f.width-width)<=4)continue;
  if(!['content','deadlines'].includes(id))return;
  const left=layout.sections.content?.frame,right=layout.sections.deadlines?.frame;
  if(!ids.includes('content')||!ids.includes('deadlines')||!left||!right||left.x>2||left.width/width<.63||left.width/width>.70||Math.abs(left.y-right.y)>2||right.x-left.width<0||right.x-left.width>32||Math.abs(right.x+right.width-width)>4)return;
 }
 const ordered=framed.sort((a,b)=>layout.sections[a]!.frame!.y-layout.sections[b]!.frame!.y||layout.sections[a]!.frame!.x-layout.sections[b]!.frame!.x);
 // New sections have no private frame. Insert them by their normal neighbours
 // without changing captured positions or persisting a replacement layout.
 for(const id of ids.filter(id=>!layout.sections[id]?.frame)){
  const at=ids.indexOf(id),next=ids.slice(at+1).find(id=>ordered.includes(id));
  ordered.splice(next?ordered.indexOf(next):ordered.length,0,id);
 }
 return ordered;
}
