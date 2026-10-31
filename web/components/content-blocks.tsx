'use client';
import {EntryEdit} from './owner-inline';
import type {Entry,Locale} from '@/lib/types';
import {artworkForLocale,serviceArtworkLocale} from '@/lib/artwork';
import ArtworkMedia from './artwork-media';
import DetailCopy from './detail-copy';
import {textAppearance,textAppearanceStyle} from '@/lib/text-appearance';
import {cleanPublicInformationText} from '@/lib/public-information-text';
export default function ContentBlocks({entry,locale}:{entry:Entry;locale:Locale}){
 const blocks=entry.contentBlocks?.map((block,index)=>{
  if(block.type==='text'){
   const body=cleanPublicInformationText(block.body[locale]),title=cleanPublicInformationText(block.title?.[locale]);
   if(!body.trim()&&(!title.trim()||!!block.body[locale].trim()))return null;
   return <section className="detail-section" key={block.id}>{title.trim()&&<h4 style={textAppearanceStyle(block.textStyle?.[locale]||textAppearance(entry,locale),'title')}>{title}</h4>}<DetailCopy text={body} locale={locale} gameId={entry.gameId} preserve appearance={block.textStyle?.[locale]||textAppearance(entry,locale)}/><EntryEdit entry={entry} locale={locale} scope={`field:contentBlocks.${index}`} compact/></section>;
  }
  if(!artworkForLocale(block.asset,locale,'full',serviceArtworkLocale(entry.region,entry.gameId)).image)return null;
  const caption=cleanPublicInformationText(block.asset.imageCaption?.[locale]);
  return <figure className="owner-content-image" key={block.id}><ArtworkMedia art={block.asset} locale={locale} serviceLocale={serviceArtworkLocale(entry.region,entry.gameId)} mode="full" alt={caption}/>{caption.trim()&&<figcaption style={textAppearanceStyle(textAppearance(entry,locale))}>{caption}</figcaption>}<EntryEdit entry={entry} locale={locale} scope={`field:contentBlocks.${index}.asset`} compact/></figure>;
 }).filter(Boolean);
 return blocks?.length?<div className="owner-content-blocks">{blocks}</div>:null;
}
