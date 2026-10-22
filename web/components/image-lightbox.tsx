'use client';
import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {ExternalLink,Maximize2,Minus,Plus,X} from 'lucide-react';
import type {Locale} from '@/lib/types';
const labels={
 ko:{open:'이미지 크게 보기',close:'닫기',fit:'화면에 맞춤',original:'원본 크기',source:'원본 열기',in:'확대',out:'축소',hint:'확대한 이미지는 스크롤해서 볼 수 있어요.'},
 en:{open:'Enlarge image',close:'Close',fit:'Fit to screen',original:'Native size',source:'Open original',in:'Zoom in',out:'Zoom out',hint:'Scroll to explore the enlarged image.'},
 ja:{open:'画像を拡大',close:'閉じる',fit:'画面に合わせる',original:'原寸',source:'原本を開く',in:'拡大',out:'縮小',hint:'拡大した画像はスクロールして確認できます。'},
 zh:{open:'放大图片',close:'关闭',fit:'适应屏幕',original:'原始尺寸',source:'打开原图',in:'放大',out:'缩小',hint:'放大后可滚动查看图片。'},
};
export default function ImageLightbox({src,alt,locale,caption,children}:{src:string;alt:string;locale:Locale;caption?:string;children:ReactNode}){
 const [open,setOpen]=useState(false),[zoom,setZoom]=useState(0),[size,setSize]=useState({width:0,height:0}),[viewport,setViewport]=useState({width:0,height:0,dpr:1}),ref=useRef<HTMLDialogElement>(null),id=useId(),t=labels[locale];
 useEffect(()=>{if(!open)return;const d=ref.current,previous=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';d?.showModal();const measure=()=>{const bounds=d?.querySelector('.image-lightbox-stage')?.getBoundingClientRect();setViewport({width:bounds?.width||window.innerWidth,height:bounds?.height||window.innerHeight,dpr:window.devicePixelRatio||1});};measure();window.addEventListener('resize',measure);return()=>{window.removeEventListener('resize',measure);document.documentElement.style.overflow=previous;};},[open]);
 const native=1/Math.max(1,viewport.dpr),fit=size.width&&viewport.width?Math.min(viewport.width/size.width,viewport.height/size.height,native):native;
 const scale=fit+(native-fit)*zoom;
 return <><button type="button" className="art-zoom-trigger" aria-label={alt+' · '+t.open} onClick={e=>{e.stopPropagation();setZoom(0);setOpen(true);}}>{children}<span className="art-zoom-hint"><Maximize2 size={16}/>{t.open}</span></button>{open&&createPortal(<dialog ref={ref} className="image-lightbox" aria-labelledby={id} onCancel={e=>{e.preventDefault();setOpen(false);}} onClose={()=>setOpen(false)} onClick={e=>e.stopPropagation()}><header><h2 id={id}>{alt}</h2><button type="button" autoFocus aria-label={t.close} onClick={()=>setOpen(false)}><X size={24}/></button></header><div className="image-lightbox-toolbar"><button type="button" disabled={zoom<=0} aria-label={t.out} onClick={()=>setZoom(x=>Math.max(0,x-.25))}><Minus size={18}/></button><button type="button" disabled={zoom>=1||native===fit} aria-label={t.in} onClick={()=>setZoom(x=>Math.min(1,x+.25))}><Plus size={18}/></button><button type="button" onClick={()=>setZoom(0)} aria-pressed={zoom===0}>{t.fit}</button><button type="button" onClick={()=>setZoom(1)} aria-pressed={zoom===1}>{t.original}</button><a href={src} target="_blank" rel="noreferrer">{t.source}<ExternalLink size={15}/></a></div><div className="image-lightbox-stage" onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}><img src={src} alt={alt} decoding="async" style={{width:size.width?size.width*scale:undefined,height:size.height?size.height*scale:undefined}} onLoad={e=>setSize({width:e.currentTarget.naturalWidth,height:e.currentTarget.naturalHeight})}/></div><footer>{caption&&<p>{caption}</p>}<small>{t.hint}{size.width>0&&` · ${size.width} × ${size.height}`}</small></footer></dialog>,document.body)}</>;
}
