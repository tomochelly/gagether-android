'use client';
import {EntryEdit} from './owner-inline';
import type {Entry,Locale} from '@/lib/types';
import {artworkForLocale,serviceArtworkLocale} from '@/lib/artwork';
import ArtworkMedia from './artwork-media';
import DetailCopy from './detail-copy';
export default function ContentBlocks({entry,locale}:{entry:Entry;locale:Locale}){return <div className="owner-content-blocks">{entry.contentBlocks?.map(block=>block.type==='text'?<section className="detail-section" key={block.id}>{block.title?.[locale]&&<h4>{block.title[locale]}</h4>}<DetailCopy text={block.body[locale]} locale={locale} gameId={entry.gameId}/><EntryEdit entry={entry} locale={locale} scope="details" compact/></section>:artworkForLocale(block.asset,locale,'full',serviceArtworkLocale(entry.region,entry.gameId)).image?<figure className="owner-content-image" key={block.id}><ArtworkMedia art={block.asset} locale={locale} serviceLocale={serviceArtworkLocale(entry.region,entry.gameId)} mode="full" alt={block.asset.imageCaption?.[locale]||''}/>{block.asset.imageCaption?.[locale]&&<figcaption>{block.asset.imageCaption[locale]}</figcaption>}<EntryEdit entry={entry} locale={locale} scope="details" compact/></figure>:null)}</div>;}
