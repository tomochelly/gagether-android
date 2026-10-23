'use client';
import {useState} from 'react';
import type {Entry,Locale} from '@/lib/types';
import {sourceBodyFor} from '@/lib/source-bodies';
import {cleanDisplayText} from '@/lib/content-display';
import {languageLabel} from '@/lib/presentation';
import ImageLightbox from './image-lightbox';
import DetailCopy from './detail-copy';
function ArticleImage({src,locale}:{src:string;locale:Locale}){const [failed,setFailed]=useState(false),[width,setWidth]=useState<number>();if(failed)return null;return <figure><ImageLightbox src={src} alt={{ko:'공지 이미지',en:'Notice image',ja:'告知画像',zh:'公告图片'}[locale]} locale={locale}><img src={src} alt="" loading="lazy" decoding="async" style={{width,maxWidth:'100%',height:'auto'}} onLoad={e=>setWidth(e.currentTarget.naturalWidth/Math.max(1,window.devicePixelRatio||1))} onError={()=>setFailed(true)}/></ImageLightbox></figure>;}
export default function SourceArticle({entry,locale}:{entry:Entry;locale:Locale}){
 const {body,images}=sourceBodyFor(entry,locale);if(!body)return null;
 const detailed=entry.detailSections?.some(s=>cleanDisplayText(s.body[locale]))||entry.contentBlocks?.length;
 const text=cleanDisplayText(body.text),shown=new Set([entry.image,...entry.detailImages?.map(a=>a.image)||[]]),art=images.filter(src=>!shown.has(src));
 return <details className="source-article" open={!detailed||undefined}><summary><span>{{ko:'공지 내용',en:'Notice',ja:'お知らせ',zh:'公告内容'}[locale]}</span>{body.locale!==locale&&<small>{languageLabel(body.locale,locale)} · {{ko:'원문',en:'Original',ja:'原文',zh:'原文'}[locale]}</small>}<a href={body.sourceUrl} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>↗</a></summary><div className="source-article-body" lang={body.locale}>{text&&<DetailCopy text={text} locale={body.locale} gameId={entry.gameId}/>}{!!body.links?.length&&<div className="source-article-links">{body.links.map(l=><a key={l.url} href={l.url} target="_blank" rel="noreferrer">{l.label} ↗</a>)}</div>}{!!art.length&&<div className="source-article-images">{art.map(src=><ArticleImage key={src} src={src} locale={locale}/>)}</div>}</div></details>;
}
