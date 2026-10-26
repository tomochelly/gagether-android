'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import type {EntityArtwork,Locale} from '@/lib/types';
import {artworkForLocale,previewFocus,previewGeometry,previewSurface,artworkAnchor} from '@/lib/artwork';
import {imageFrame,frameGeometry,type FrameBox} from '@/lib/image-framing';
import {ImageOff} from 'lucide-react';
import {ui} from '@/lib/i18n';
import {languageLabel} from '@/lib/presentation';
import ImageLightbox from './image-lightbox';
import {useCatalog} from './catalog-context';
import {catalogPreview} from '@/lib/catalog-preview';

export default function ArtworkMedia({art:input,alt,mode='preview',priority=false,className='',locale='ko',serviceLocale,fitPreview='focus',banner=false,onUnavailable,editorPreview=false,frameBox}:{art:EntityArtwork;alt:string;mode?:'preview'|'full';priority?:boolean;className?:string;locale?:Locale;serviceLocale?:Locale;fitPreview?:'focus'|'contain';banner?:boolean|'version';onUnavailable?:()=>void;editorPreview?:boolean;frameBox?:FrameBox}){
 const {editMode}=useCatalog();
 const art=editorPreview&&editMode?input:artworkForLocale(input,locale,mode,serviceLocale);
 const box=useRef<HTMLSpanElement>(null);const img=useRef<HTMLImageElement>(null);
 const [size,setSize]=useState({width:0,height:0});const [natural,setNatural]=useState({src:'',width:0,height:0});
 const [failed,setFailed]=useState(''),[previewFailed,setPreviewFailed]=useState(''),[retry,setRetry]=useState(0);const [pixelRatio,setPixelRatio]=useState(1);
 const focus=previewFocus(art);
 const [mobile,setMobile]=useState(false);
 useEffect(()=>{const check=()=>setMobile(window.innerWidth<=760);check();window.addEventListener("resize",check);return()=>window.removeEventListener("resize",check);},[]);
 const target=frameBox||size,renderScale=frameBox&&size.width?size.width/frameBox.width:1,frame=imageFrame(art,frameBox?.kind||(banner?(mobile?"mobile":"banner"):"card"));
 useEffect(()=>{
  const updateRatio=()=>setPixelRatio(window.devicePixelRatio||1);updateRatio();
  window.addEventListener('resize',updateRatio);
  return()=>window.removeEventListener('resize',updateRatio);
 },[]);
 useEffect(()=>{
  // Full images use intrinsic sizing, avoiding a measurement/layout feedback loop.
  if(mode!=='preview')return;
  const node=box.current;if(!node)return;
  const observer=new ResizeObserver(([entry])=>{
   const width=Math.round(entry.contentRect.width),height=Math.round(entry.contentRect.height);
   setSize(previous=>previous.width===width&&previous.height===height?previous:{width,height});
  });observer.observe(node);return()=>observer.disconnect();
 },[mode]);
 const candidate=mode==='preview'&&!frame&&previewFailed!==art.image?catalogPreview(art.image):undefined;
 const thumbnail=candidate&&(!target.width||Math.max(target.width/candidate.width,target.height/candidate.height)*focus.zoom*pixelRatio<=1)?candidate:undefined,src=thumbnail?.url||art.image;
 useEffect(()=>{setFailed('');setPreviewFailed('');setRetry(0)},[art.image]);
 useEffect(()=>{const node=img.current;if(node?.complete&&node.naturalWidth)setNatural({src:src||'',width:node.naturalWidth,height:node.naturalHeight});},[src,retry]);
 useEffect(()=>{if(!failed||failed!==src)return;if(retry<2){const timer=setTimeout(()=>{setRetry(n=>n+1);setFailed('')},retry===0?400:1500);return()=>clearTimeout(timer);}onUnavailable?.();const online=()=>{setRetry(0);setFailed('')};window.addEventListener('online',online);return()=>window.removeEventListener('online',online);},[failed,src,retry]);
 const loaded=natural.src===src&&natural.width>0;
 const dimensions='width' in art?art as EntityArtwork&{width:number;height:number}:undefined;
 const width=loaded?natural.width:dimensions?.width,height=loaded?natural.height:dimensions?.height;
 const ready=loaded&&target.width>0&&target.height>0;
 const containScale=ready?Math.min(target.width/natural.width,target.height/natural.height,1/Math.max(1,pixelRatio)):1;
 const rawGeometry=ready?(frame?frameGeometry(natural,target,frame,pixelRatio):fitPreview==='contain'?{width:natural.width*containScale,height:natural.height*containScale,left:(target.width-natural.width*containScale)/2,top:(target.height-natural.height*containScale)/2}:previewGeometry(natural,target,focus,pixelRatio,art.previewBounds,artworkAnchor(natural,target,pixelRatio,banner))):undefined;
 const geometry=rawGeometry?{...rawGeometry,width:rawGeometry.width*renderScale,height:rawGeometry.height*renderScale,left:rawGeometry.left*renderScale,top:rawGeometry.top*renderScale}:undefined;
 const versionInset=banner==='version'&&geometry&&geometry.width<size.width*.78;
 const surface=geometry?previewSurface(geometry,size,frame||fitPreview==='contain'?undefined:art.previewBounds):undefined;
 const surfaceStyle:CSSProperties=surface?{position:'absolute',left:surface.left,top:surface.top,width:surface.width,height:surface.height,'--edge-left':`${surface.fadeLeft}px`,'--edge-right':`${surface.fadeRight}px`,'--edge-top':`${surface.fadeTop}px`,'--edge-bottom':`${surface.fadeBottom}px`} as CSSProperties:{opacity:0};
 const style:CSSProperties=mode==='full'?{objectFit:'contain',objectPosition:'center',width:width?width/Math.max(1,pixelRatio):undefined,maxWidth:'100%',height:'auto'}:geometry&&surface?{position:'absolute',width:geometry.width,height:geometry.height,left:surface.imageLeft,top:surface.imageTop,objectFit:'fill',margin:0}:{opacity:0};
 const available=!!src&&failed!==src;
 const regionalLabel=art.imageLocale&&art.imageLocale!=='neutral'&&art.imageLocale!==locale&&!(mode==='preview'&&art.textFreePreview&&art.previewBounds);
 const picture=available?<img key={(src||'')+'|'+retry} ref={img} src={src} alt={alt} width={width} height={height} style={style} loading={mode==='full'||priority?'eager':'lazy'} decoding="async" fetchPriority={priority?'high':'auto'} onLoad={e=>setNatural({src:src||'',width:e.currentTarget.naturalWidth,height:e.currentTarget.naturalHeight})} onError={()=>{if(thumbnail){setPreviewFailed(art.image||'');setRetry(0);}else setFailed(src||'');}}/>:null;
 return <span aria-busy={available&&!loaded} ref={box} data-art-banner={banner==='version'?'version':banner?'pickup':undefined} data-art-frame={frameBox?.kind||(banner?(mobile?'mobile':'banner'):'card')} className={'art-media '+mode+' '+className+(available?'':' art-unavailable')+(mode==='preview'&&natural.width/natural.height>3?' wide-banner':'')+(versionInset?' version-art-inset':'')}>
  {available?(mode==='preview'?<span className="art-surface" style={surfaceStyle}>{picture}</span>:!editMode?<ImageLightbox src={art.image!} alt={alt} locale={locale} caption={art.imageCaption?.[locale]}>{picture}</ImageLightbox>:picture):<span className="art-pending"><ImageOff size={24}/>{failed?({ko:'이미지를 불러오지 못했어요',en:'Image could not load',ja:'画像を読み込めませんでした',zh:'图片加载失败'})[locale]:ui[locale].imagePending}{failed&&mode==='full'&&!editMode&&<button type="button" onClick={e=>{e.stopPropagation();setRetry(0);setFailed('')}}>{({ko:'다시 불러오기',en:'Retry image',ja:'再読み込み',zh:'重新加载'})[locale]}</button>}</span>}
  {available&&regionalLabel&&<small className="art-language">{languageLabel(art.imageLocale as Locale,locale)} · {({ko:'원본',en:'Original',ja:'原文',zh:'原文'})[locale]}</small>}
 </span>;
}
