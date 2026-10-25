'use client';
import {EntryEdit} from './owner-inline';
import type {Entry,Locale} from '@/lib/types';
import {artworkForLocale,serviceArtworkLocale} from '@/lib/artwork';
import ArtworkMedia from './artwork-media';
import DetailCopy from './detail-copy';
import {textAppearance,textAppearanceStyle} from '@/lib/text-appearance';
export default function ContentBlocks({entry,locale}:{entry:Entry;locale:Locale}){return <div className="owner-content-blocks">{entry.contentBlocks?.map(block=>block.type==='text'?<section className="detail-section" key={block.id}>{block.title?.[locale]&&<h4 style={textAppearanceStyle(block.textStyle?.[locale]||textAppearance(entry,locale),'title')}>{block.title[locale]}</h4>}<DetailCopy text={block.body[locale]} locale={locale} gameId={entry.gameId} preserve appearance={block.textStyle?.[locale]||textAppearance(entry,locale)}/><EntryEdit entry={entry} locale={locale} scope="details" compact/></section>:artworkForLocale(block.asset,locale,'full',serviceArtworkLocale(entry.region,entry.gameId)).image?<figure className="owner-content-image" key={block.id}><ArtworkMedia art={block.asset} locale={locale} serviceLocale={serviceArtworkLocale(entry.region,entry.gameId)} mode="full" alt={block.asset.imageCaption?.[locale]||''}/>{block.asset.imageCaption?.[locale]&&<figcaption style={textAppearanceStyle(textAppearance(entry,locale))}>{block.asset.imageCaption[locale]}</figcaption>}<EntryEdit entry={entry} locale={locale} scope="details" compact/></figure>:null)}</div>;}
