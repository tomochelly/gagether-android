import {sectionIds,sectionOrder,type SectionId} from './site-layout';

export const PERSONAL_LAYOUT_KEY='gagether.personal-layout.v1';
export type CanvasFrame={x:number;y:number;width:number};
export type SectionSize={hidden?:boolean;width?:number;height?:number|null;frame?:CanvasFrame;layer?:number};
export type PersonalLayout={order:SectionId[];sections:Partial<Record<SectionId,SectionSize>>;canvas?:{width:number}};
export type PersonalLayouts=Record<string,PersonalLayout>;
export const emptyLayout=():PersonalLayout=>({order:[],sections:{}});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export const layoutScope=(v:string)=>v==='overview'||/^game:[a-z0-9-]{1,60}$/.test(v);
/** Strict private-profile boundary: invalid saved preferences are never silently replaced. */
export function parsePersonalLayouts(value:unknown):PersonalLayouts{
 if(value===undefined)return {};
 if(!object(value)||Object.keys(value).length>64)throw Error('Invalid personal layouts');
 const result:PersonalLayouts={};
 for(const [scope,v]of Object.entries(value)){
  if(!layoutScope(scope)||!object(v)||!Array.isArray(v.order)||v.order.length>sectionIds.length||new Set(v.order).size!==v.order.length||v.order.some(id=>!sectionIds.includes(id as SectionId))||!object(v.sections)||Object.keys(v.sections).length>sectionIds.length)throw Error('Invalid personal layout');
  if(v.canvas!==undefined&&(!object(v.canvas)||Object.keys(v.canvas).some(k=>k!=='width')||!Number.isInteger(v.canvas.width)||Number(v.canvas.width)<240||Number(v.canvas.width)>6000))throw Error('Invalid canvas');
  const sections:PersonalLayout['sections']={};
  for(const [id,size]of Object.entries(v.sections)){
   if(!sectionIds.includes(id as SectionId)||!object(size)||Object.keys(size).some(k=>!['hidden','width','height','frame','layer'].includes(k))||size.hidden!==undefined&&typeof size.hidden!=='boolean'||size.width!==undefined&&(!Number.isInteger(size.width)||Number(size.width)<3||Number(size.width)>12)||size.height!==undefined&&size.height!==null&&(!Number.isInteger(size.height)||Number(size.height)<180||Number(size.height)>2400)||size.layer!==undefined&&(!Number.isInteger(size.layer)||Number(size.layer)<0||Number(size.layer)>10000))throw Error('Invalid section size');
   const f=size.frame;if(f!==undefined&&(!object(f)||Object.keys(f).some(k=>!['x','y','width'].includes(k))||!Number.isInteger(f.x)||Number(f.x)<0||Number(f.x)>6000||!Number.isInteger(f.y)||Number(f.y)<0||Number(f.y)>100000||!Number.isInteger(f.width)||Number(f.width)<180||Number(f.width)>6000||Number(f.x)+Number(f.width)>Number((v.canvas as {width:number}|undefined)?.width||6000)))throw Error('Invalid canvas frame');
   sections[id as SectionId]={...(size.hidden!==undefined?{hidden:size.hidden as boolean}:{}),...(size.width!==undefined?{width:size.width as number}:{}),...(size.height!==undefined?{height:size.height as number|null}:{}),...(f!==undefined?{frame:{x:Number((f as CanvasFrame).x),y:Number((f as CanvasFrame).y),width:Number((f as CanvasFrame).width)}}:{}),...(size.layer!==undefined?{layer:Number(size.layer)}:{})};
  }
  result[scope]={order:v.order as SectionId[],sections,...(v.canvas?{canvas:{width:Number((v.canvas as {width:number}).width)}}:{})};
 }
 return result;
}
export function readPersonalLayouts(raw:string|null){
 if(!raw)return {};
 const v=JSON.parse(raw);if(!object(v)||v.version!==1)throw Error('Invalid layout storage');
 return parsePersonalLayouts(v.layouts);
}
export const encodePersonalLayouts=(layouts:PersonalLayouts)=>JSON.stringify({version:1,layouts:parsePersonalLayouts(layouts)});
export function personalSectionOrder(layout:PersonalLayout|undefined,base:SectionId[]){
 return layout?.order.length?sectionOrder(layout.order):base;
}
export function patchSection(layout:PersonalLayout,id:SectionId,patch:SectionSize):PersonalLayout{
 return {...layout,sections:{...layout.sections,[id]:{...layout.sections[id],...patch}}};
}
export function resizedSection(width:number,height:number,dx:number,dy:number,boardWidth:number){
 return {width:Math.max(3,Math.min(12,Math.round((width+dx)/Math.max(1,boardWidth)*12))),height:Math.max(180,Math.min(2400,Math.round((height+dy)/10)*10))};
}
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
/** Merge each game's order and individual controls, preserving unrelated device edits. */
export function mergePersonalLayouts(base:PersonalLayouts|undefined,local:PersonalLayouts|undefined,remote:PersonalLayouts|undefined,initial=false){
 const result:PersonalLayouts={...remote};
 for(const scope of new Set([...Object.keys(base||{}),...Object.keys(local||{})])){
  const before=base?.[scope],mine=local?.[scope],other=remote?.[scope];
  if(same(before,mine)||initial&&other)continue;
  if(!mine){delete result[scope];continue;}
  if(!other||same(before,other)){result[scope]=mine;continue;}
  const sections:PersonalLayout['sections']={...other.sections};
  for(const id of sectionIds){
   const old=before?.sections[id],next=mine.sections[id],theirs=other.sections[id];
   if(same(old,next))continue;
   if(!next){delete sections[id];continue;}
   const merged:SectionSize={...theirs};
   for(const key of ['hidden','width','height','frame','layer']as const){if(!same(old?.[key],next[key]))Object.assign(merged,{[key]:next[key]});}
   sections[id]=merged;
  }
  result[scope]={order:same(before?.order,mine.order)?other.order:mine.order,sections,...((same(before?.canvas,mine.canvas)?other.canvas:mine.canvas)?{canvas:same(before?.canvas,mine.canvas)?other.canvas:mine.canvas}:{})};
  const chosen=result[scope];if(chosen.canvas){const required=Math.max(chosen.canvas.width,...Object.values(sections).map(s=>s?.frame?s.frame.x+s.frame.width:0));chosen.canvas={width:required};}
 }
 return parsePersonalLayouts(result);
}
