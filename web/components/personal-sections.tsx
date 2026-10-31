'use client';
import {useEffect,useId,useRef,useState,type CSSProperties,type ReactNode,type PointerEvent,type KeyboardEvent} from 'react';
import {Check,EyeOff,GripVertical,LayoutDashboard,Maximize2,RotateCcw,Undo2,Redo2,BringToFront,SendToBack,Move,LayoutList} from 'lucide-react';
import type {Locale} from '@/lib/types';
import {layoutText,type SectionId} from '@/lib/site-layout';
import {PERSONAL_APPLIED,personalChanged} from '@/lib/personal-storage-events';
import {PERSONAL_LAYOUT_KEY,emptyLayout,encodePersonalLayouts,patchSection,personalSectionOrder,readPersonalLayouts,type CanvasFrame,type PersonalLayout,type SectionSize} from '@/lib/personal-layout';
import {arrangeCanvas,capturedFlowOrder,canvasFrameFor,captureCanvas,clampFrame,defaultColumns,moveCanvas,raiseCanvas,resizeCanvas,type CanvasMeasurement} from '@/lib/personal-canvas';
import {personalLayoutCopy} from '@/lib/personal-layout-copy';

type Section={id:SectionId;content:ReactNode};
type Gesture={id:SectionId;mode:'move'|'resize';startX:number;startY:number;frame:CanvasFrame;height:number;patch?:SectionSize;pointerX:number;pointerY:number};
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
function NumberField({label,value,onCommit,disabled=false}:{label:string;value:number;onCommit:(value:number)=>void;disabled?:boolean}){
 const [text,setText]=useState(String(value)),focused=useRef(false);
 useEffect(()=>{if(!focused.current)setText(String(value));},[value]);
 return <label className="personal-canvas-number"><span>{label}</span><input type="number" inputMode="numeric" aria-label={label} value={text} disabled={disabled} onFocus={()=>{focused.current=true;}} onChange={e=>setText(e.target.value)} onBlur={()=>{focused.current=false;const n=Number(text);if(text.trim()&&Number.isFinite(n))onCommit(n);else setText(String(value));}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();if(e.key==='Escape'){setText(String(value));focused.current=false;}}}/></label>;
}
export default function PersonalSections({scope,locale,sections,compactSchedule=false}:{scope:string;locale:Locale;sections:Section[];compactSchedule?:boolean}){
 const c=personalLayoutCopy[locale],labels=layoutText[locale].sections,panelId=useId();
 const [layout,setLayout]=useState<PersonalLayout>(emptyLayout),[ready,setReady]=useState(false),[open,setOpen]=useState(false),[error,setError]=useState<'error'|'locked'|null>(null),[historyVersion,setHistoryVersion]=useState(0),[selected,setSelected]=useState<SectionId|null>(null),[motion,setMotion]=useState<{id:SectionId;patch:SectionSize}|null>(null),[heights,setHeights]=useState<Partial<Record<SectionId,number>>>({});
 const current=useRef(layout),locked=useRef(false),board=useRef<HTMLDivElement>(null),viewport=useRef<HTMLDivElement>(null),history=useRef<PersonalLayout[]>([]),future=useRef<PersonalLayout[]>([]),gesture=useRef<Gesture|null>(null),autoFrame=useRef<number|undefined>(undefined);
 const base=sections.map(s=>s.id),order=personalSectionOrder(layout,base),available=order.filter(id=>sections.some(s=>s.id===id&&s.content)),visible=available.filter(id=>!layout.sections[id]?.hidden),canvas=!!layout.canvas,width=layout.canvas?.width||1040;
 const flowOrder=!open?capturedFlowOrder(layout,visible):undefined,positioned=canvas&&!flowOrder;
 useEffect(()=>{
  const read=()=>{try{const next=readPersonalLayouts(localStorage.getItem(PERSONAL_LAYOUT_KEY))[scope]||emptyLayout();if(!same(current.current,next)){gesture.current=null;setMotion(null);current.current=next;setLayout(next);history.current=[];future.current=[];setHistoryVersion(n=>n+1);}locked.current=false;setError(null);}catch{locked.current=true;setError('locked');}setReady(true);};
  const storage=(e:StorageEvent)=>{if(e.key===PERSONAL_LAYOUT_KEY||e.key===null)read();};read();window.addEventListener('storage',storage);window.addEventListener(PERSONAL_APPLIED,read);
  return()=>{window.removeEventListener('storage',storage);window.removeEventListener(PERSONAL_APPLIED,read);if(autoFrame.current!==undefined)cancelAnimationFrame(autoFrame.current);};
 },[scope]);
 useEffect(()=>{
  const measure=()=>{const next:Partial<Record<SectionId,number>>={};board.current?.querySelectorAll<HTMLElement>('[data-page-section]').forEach(el=>{next[el.dataset.pageSection as SectionId]=Math.round(el.getBoundingClientRect().height);});setHeights(old=>same(old,next)?old:next);};
  measure();const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;board.current?.querySelectorAll('[data-page-section]').forEach(el=>observer?.observe(el));window.addEventListener('resize',measure);return()=>{observer?.disconnect();window.removeEventListener('resize',measure);};
 },[canvas,open,available.join('|'),visible.join('|')]);
 function persist(next:PersonalLayout,recover=false){if(locked.current&&!recover)return;try{const all=recover?{}:readPersonalLayouts(localStorage.getItem(PERSONAL_LAYOUT_KEY));all[scope]=next;localStorage.setItem(PERSONAL_LAYOUT_KEY,encodePersonalLayouts(all));locked.current=false;setError(null);personalChanged();}catch{setError('error');}}
 function change(next:PersonalLayout){if(locked.current||same(current.current,next))return;history.current=[...history.current.slice(-39),current.current];future.current=[];current.current=next;setLayout(next);setHistoryVersion(n=>n+1);persist(next);}
 function undo(redo=false){const from=redo?future:history,to=redo?history:future,next=from.current.pop();if(!next)return;to.current.push(current.current);current.current=next;setLayout(next);setHistoryVersion(n=>n+1);setSelected(null);persist(next);}
 function begin(){
  if(!current.current.canvas&&board.current&&!locked.current){const rect=board.current.getBoundingClientRect(),measurements:Partial<Record<SectionId,CanvasMeasurement>>={};board.current.querySelectorAll<HTMLElement>('[data-page-section]').forEach(el=>{const r=el.getBoundingClientRect();measurements[el.dataset.pageSection as SectionId]={x:r.left-rect.left,y:r.top-rect.top,width:r.width,height:r.height};});const next=captureCanvas(current.current,measurements,board.current.clientWidth||rect.width||1040);current.current=next;setLayout(next);persist(next);}
  setOpen(true);setSelected(visible[0]||null);
 }
 function patch(id:SectionId,size:SectionSize){let next=current.current;if(next.canvas&&!next.sections[id]?.frame)next=patchSection(next,id,{frame:canvasFrameFor(next,id,available.indexOf(id),heights,available)});change(patchSection(next,id,size));}
 function finish(cancel=false){const g=gesture.current;gesture.current=null;setMotion(null);if(autoFrame.current!==undefined)cancelAnimationFrame(autoFrame.current);autoFrame.current=undefined;if(g?.patch&&!cancel)change(raiseCanvas(patchSection(current.current,g.id,g.patch),g.id));}
 function preview(clientX:number,clientY:number){const g=gesture.current;if(!g||!board.current)return;g.pointerX=clientX;g.pointerY=clientY;const r=board.current.getBoundingClientRect(),dx=clientX-r.left-g.startX,dy=clientY-r.top-g.startY;
  if(Math.abs(dx)+Math.abs(dy)<3&&!g.patch)return;
  const next=g.mode==='move'?{frame:moveCanvas(g.frame,dx,dy,width)}:resizeCanvas(g.frame,g.height,dx,dy,width);if(same(g.patch,next))return;g.patch=next;setMotion({id:g.id,patch:next});
 }
 function autoScroll(){const g=gesture.current;if(!g)return;const edge=48,dy=g.pointerY>window.innerHeight-edge?16:g.pointerY<edge?-16:0;if(dy)window.scrollBy(0,dy);const view=viewport.current,r=view?.getBoundingClientRect();if(view&&r){if(g.pointerX>r.right-edge)view.scrollLeft+=12;else if(g.pointerX<r.left+edge)view.scrollLeft-=12;}preview(g.pointerX,g.pointerY);autoFrame.current=requestAnimationFrame(autoScroll);}
 function start(e:PointerEvent<HTMLButtonElement>,id:SectionId,mode:'move'|'resize'){
  if(locked.current||e.button!==0||!canvas||!board.current)return;e.preventDefault();setSelected(id);const r=board.current.getBoundingClientRect(),frame=canvasFrameFor(current.current,id,available.indexOf(id),heights,available),body=e.currentTarget.closest('[data-page-section]')?.querySelector<HTMLElement>('.personal-section-body');
  e.currentTarget.setPointerCapture?.(e.pointerId);gesture.current={id,mode,startX:e.clientX-r.left,startY:e.clientY-r.top,frame,height:body?.getBoundingClientRect().height||layout.sections[id]?.height||400,pointerX:e.clientX,pointerY:e.clientY};autoFrame.current=requestAnimationFrame(autoScroll);
 }
 function keyMove(e:KeyboardEvent<HTMLButtonElement>,id:SectionId,resize=false){
  if(e.key==='Escape'){finish(true);setSelected(null);return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||locked.current)return;e.preventDefault();setSelected(id);const frame=canvasFrameFor(current.current,id,available.indexOf(id),heights,available),step=e.shiftKey?1:10,dx=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0,dy=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;
  const size=resize?resizeCanvas(frame,layout.sections[id]?.height||heights[id]||400,dx,dy,width):{frame:moveCanvas(frame,dx,dy,width)};change(raiseCanvas(patchSection(current.current,id,size),id));
 }
 const selectedId=selected&&visible.includes(selected)?selected:null,selectedSize=selectedId?{...layout.sections[selectedId],...(motion?.id===selectedId?motion.patch:{})}:undefined,selectedFrame=selectedId?(selectedSize?.frame||canvasFrameFor(layout,selectedId,available.indexOf(selectedId),heights,available)):undefined;
 const bodyHeight=Math.max(0,...visible.map((id,i)=>{const size={...layout.sections[id],...(motion?.id===id?motion.patch:{})},frame=size.frame||canvasFrameFor(layout,id,i,heights,available),height=size.height||heights[id]||0;return height?frame.y+height+32:0;}));
 const compact=compactSchedule&&!open&&!canvas&&!layout.order.length&&!Object.keys(layout.sections).length;
 const compactIds:SectionId[]=['resets','events','deadlines'];
 const renderSection=(id:SectionId,index:number)=>{
     const size={...layout.sections[id],...(motion?.id===id?motion.patch:{})},frame=canvasFrameFor(layout,id,index,heights,available),activeFrame=size.frame||frame,height=size.height;
     const style:CSSProperties=positioned?{position:'absolute',left:activeFrame.x,top:activeFrame.y,width:activeFrame.width,zIndex:motion?.id===id?10001:size.layer||0}:{'--section-columns':size.width??defaultColumns(id)}as CSSProperties;
     return <div key={id} className={'page-layout-section personal-layout-section'+(open?' personal-layout-editing':'')+(selectedId===id?' is-selected':'')+(id==='content'?' is-feed':'')+(id==='deadlines'?' is-deadlines':'')} data-page-section={id} style={style}>
      <div className="personal-section-body" inert={open||undefined} style={{height:height||undefined}}>{sections.find(s=>s.id===id)!.content}</div>
      {open&&<><button type="button" className="personal-canvas-hitarea" disabled={locked.current||!canvas} aria-label={c.drag+' · '+labels[id]} aria-pressed={selectedId===id} onClick={()=>setSelected(id)} onPointerDown={e=>start(e,id,'move')} onPointerMove={e=>preview(e.clientX,e.clientY)} onPointerUp={()=>finish()} onPointerCancel={()=>finish(true)} onLostPointerCapture={()=>finish(true)} onKeyDown={e=>keyMove(e,id)}><span><GripVertical size={16}/>{labels[id]}<Move size={14}/></span></button><button type="button" className="personal-section-resize" aria-label={c.resize+' · '+labels[id]} title={c.resize} disabled={locked.current||!canvas} onPointerDown={e=>start(e,id,'resize')} onPointerMove={e=>preview(e.clientX,e.clientY)} onPointerUp={()=>finish()} onPointerCancel={()=>finish(true)} onLostPointerCapture={()=>finish(true)} onKeyDown={e=>keyMove(e,id,true)}><Maximize2 size={15}/></button></>}
     </div>;
 };
 return <>
  <div className={'personal-layout-toolbar'+(open?' is-open':'')}><button className="personal-layout-trigger" type="button" disabled={!ready} aria-expanded={open} aria-controls={panelId} onClick={()=>{if(open){finish();setOpen(false);setSelected(null);}else begin();}}><LayoutDashboard size={16}/>{open?c.done:c.title}{open&&<Check size={15}/>}</button>{canvas&&!open&&<span className="personal-layout-saved">{c.free} · {c.scope}</span>}{error&&<span className="personal-layout-error" role="alert">{c[error]} <button type="button" onClick={()=>persist(current.current,error==='locked')}>{error==='locked'?c.recover:c.retry}</button></span>}</div>
  {open&&<section className="personal-layout-panel" id={panelId} aria-label={c.title}>
   <div className="personal-layout-intro"><div><strong>{c.free}</strong><p>{c.help}</p><small>{c.save} · {c.scope}</small></div><div className="personal-layout-actions"><button type="button" disabled={locked.current||!history.current.length} onClick={()=>undo()} aria-label={c.undo}><Undo2 size={17}/></button><button type="button" disabled={locked.current||!future.current.length} onClick={()=>undo(true)} aria-label={c.redo}><Redo2 size={17}/></button><button type="button" disabled={locked.current} onClick={()=>change(arrangeCanvas(current.current,visible,width,heights))}><LayoutList size={15}/>{c.arrange}</button><button type="button" disabled={locked.current} onClick={()=>{change(arrangeCanvas(emptyLayout(),base,width,heights,true));setSelected(null);}}><RotateCcw size={15}/>{c.reset}</button></div></div>
   <div className="personal-layout-palette">{available.map(id=><label key={id}><input type="checkbox" checked={!layout.sections[id]?.hidden} disabled={locked.current} onChange={e=>patch(id,{hidden:!e.target.checked})}/><span>{labels[id]}</span></label>)}</div>
  </section>}
  {open&&<div className="personal-canvas-inspector" aria-label={c.position}>
   <label className="personal-canvas-select"><span>{c.select}</span><select value={selectedId||''} onChange={e=>setSelected(e.target.value as SectionId||null)}><option value="">{c.select}</option>{visible.map(id=><option key={id} value={id}>{labels[id]}</option>)}</select></label>
   {selectedId&&selectedFrame&&<><NumberField label={c.x} value={selectedFrame.x} disabled={locked.current} onCommit={x=>patch(selectedId,{frame:clampFrame({...selectedFrame,x},width)})}/><NumberField label={c.y} value={selectedFrame.y} disabled={locked.current} onCommit={y=>patch(selectedId,{frame:clampFrame({...selectedFrame,y},width)})}/><NumberField label={c.width} value={selectedFrame.width} disabled={locked.current} onCommit={w=>patch(selectedId,{frame:clampFrame({...selectedFrame,width:w},width)})}/><NumberField label={c.height} value={selectedSize?.height||heights[selectedId]||400} disabled={locked.current||!selectedSize?.height} onCommit={height=>patch(selectedId,{height:Math.max(180,Math.min(2400,Math.round(height)))})}/><button type="button" disabled={locked.current} className="personal-height-auto" aria-pressed={!selectedSize?.height} onClick={()=>patch(selectedId,{height:selectedSize?.height?null:Math.max(180,Math.min(2400,heights[selectedId]||400))})}>{c.auto}</button><button type="button" disabled={locked.current} aria-label={c.front} title={c.front} onClick={()=>change(raiseCanvas(current.current,selectedId))}><BringToFront size={17}/></button><button type="button" disabled={locked.current} aria-label={c.back} title={c.back} onClick={()=>change(raiseCanvas(current.current,selectedId,false))}><SendToBack size={17}/></button><button type="button" disabled={locked.current} aria-label={c.hide+' · '+labels[selectedId]} title={c.hide} onClick={()=>{patch(selectedId,{hidden:true});setSelected(null);}}><EyeOff size={17}/></button></>}
   <small>{c.keys}</small>
  </div>}
  {!visible.length&&<p className="personal-layout-empty">{c.empty}</p>}
  <div ref={viewport} className={'personal-canvas-viewport'+(open?' is-editing':'')}>
   <div ref={board} className={'personal-layout-grid'+(compact?' has-compact-schedule':'')+(positioned?' is-canvas':flowOrder?' is-responsive-capture':'')+(open?' is-editing':'')+(motion?' is-dragging':'')} data-layout-scope={scope} data-history-version={historyVersion} style={positioned?{width,minHeight:open?Math.max(640,bodyHeight+100):bodyHeight}:undefined}>
    {(flowOrder||visible).map((id,index)=>compact&&compactIds.includes(id)?id===visible.find(v=>compactIds.includes(v))?<div className="schedule-overview-grid" key="schedule-overview">{compactIds.filter(v=>visible.includes(v)).map(v=>renderSection(v,visible.indexOf(v)))}</div>:null:renderSection(id,index))}
   </div>
  </div>
 </>;
}
