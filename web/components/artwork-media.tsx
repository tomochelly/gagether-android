'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import type {EntityArtwork,Locale} from '@/lib/types';
import {artworkForLocale,previewFocus,previewGeometry,previewSurface,versionPreviewAnchor} from '@/lib/artwork';
import {ImageOff} from 'lucide-react';
import {ui} from '@/lib/i18n';
import {languageLabel} from '@/lib/presentation';
import ImageLightbox from './image-lightbox';
import {useCatalog} from './catalog-context';

export default function ArtworkMedia({art:input,alt,mode='preview',priority=false,className='',locale='ko',serviceLocale,fitPreview='focus',banner=false,onUnavailable,editorPreview=false}:{art:EntityArtwork;alt:string;mode?:'preview'|'full';priority?:boolean;className?:string;locale?:Locale;serviceLocale?:Locale;fitPreview?:'focus'|'contain';banner?:boolean|'version';onUnavailable?:()=>void;editorPreview?:boolean}){
 const {editMode}=useCatalog();
 const art=editorPreview&&editMode?input:artworkForLocale(input,locale,mode,serviceLocale);
 const box=useRef<HTMLSpanElement>(null);const img=useRef<HTMLImageElement>(null);
 const [size,setSize]=useState({width:0,height:0});const [natural,setNatural]=useState({src:'',width:0,height:0});
 const [failed,setFailed]=useState('');const [pixelRatio,setPixelRatio]=useState(1);
 const focus=previewFocus(art);
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
 useEffect(()=>{const node=img.current;if(node?.complete&&node.naturalWidth)setNatural({src:art.image||'',width:node.naturalWidth,height:node.naturalHeight});},[art.image]);
 const loaded=natural.src===art.image&&natural.width>0;
 const dimensions='width' in art?art as EntityArtwork&{width:number;height:number}:undefined;
 const width=loaded?natural.width:dimensions?.width,height=loaded?natural.height:dimensions?.height;
 const ready=loaded&&size.width>0&&size.height>0;
 const containScale=ready?Math.min(size.width/natural.width,size.height/natural.height,1/Math.max(1,pixelRatio)):1;
 const geometry=ready?(fitPreview==='contain'?{width:natural.width*containScale,height:natural.height*containScale,left:(size.width-natural.width*containScale)/2,top:(size.height-natural.height*containScale)/2}:previewGeometry(natural,size,focus,pixelRatio,art.previewBounds,banner==='version'?versionPreviewAnchor(natural,size,pixelRatio):banner&&size.width>900?.7:.5)):undefined;
 const versionInset=banner==='version'&&geometry&&geometry.width<size.width*.78;
 const surface=geometry?previewSurface(geometry,size,fitPreview==='contain'?undefined:art.previewBounds):undefined;
 const surfaceStyle:CSSProperties=surface?{position:'absolute',left:surface.left,top:surface.top,width:surface.width,height:surface.height,'--edge-left':`${surface.fadeLeft}px`,'--edge-right':`${surface.fadeRight}px`,'--edge-top':`${surface.fadeTop}px`,'--edge-bottom':`${surface.fadeBottom}px`} as CSSProperties:{opacity:0};
 const style:CSSProperties=mode==='full'?{objectFit:'contain',objectPosition:'center',width:width?width/Math.max(1,pixelRatio):undefined,maxWidth:'100%',height:'auto'}:geometry&&surface?{position:'absolute',width:geometry.width,height:geometry.height,left:surface.imageLeft,top:surface.imageTop,objectFit:'fill',margin:0}:{opacity:0};
 const available=!!art.image&&failed!==art.image;
 const regionalLabel=art.imageLocale&&art.imageLocale!=='neutral'&&art.imageLocale!==locale&&!(mode==='preview'&&art.textFreePreview&&art.previewBounds);
 const picture=available?<img ref={img} src={art.image} alt={alt} width={width} height={height} style={style} loading={mode==='full'||priority?'eager':'lazy'} decoding="async" fetchPriority={priority?'high':'auto'} onLoad={e=>setNatural({src:art.image||'',width:e.currentTarget.naturalWidth,height:e.currentTarget.naturalHeight})} onError={()=>{setFailed(art.image||'');onUnavailable?.();}}/>:null;
 return <span ref={box} className={'art-media '+mode+' '+className+(available?'':' art-unavailable')+(mode==='preview'&&natural.width/natural.height>3?' wide-banner':'')+(versionInset?' version-art-inset':'')}>
  {available?(mode==='preview'?<span className="art-surface" style={surfaceStyle}>{picture}</span>:!editMode?<ImageLightbox src={art.image!} alt={alt} locale={locale} caption={art.imageCaption?.[locale]}>{picture}</ImageLightbox>:picture):<span className="art-pending"><ImageOff size={24}/>{ui[locale].imagePending}</span>}
  {available&&regionalLabel&&<small className="art-language">{languageLabel(art.imageLocale as Locale,locale)} · {({ko:'원본',en:'Original',ja:'原文',zh:'原文'})[locale]}</small>}
 </span>;
}
