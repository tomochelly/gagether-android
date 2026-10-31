'use client';
import {Suspense,lazy} from 'react';
import {ImageOff} from 'lucide-react';
import type {Entry,EntityArtwork,Locale,Localized} from '@/lib/types';
import {artworkForLocale,serviceArtworkLocale} from '@/lib/artwork';
import {thumbnailMembers,pickupThumbnailHead,pickupThumbnailFrame} from '@/lib/pickup-thumbnail';
import ThumbnailImage from './thumbnail-image';
const Montage=lazy(()=>import('./pickup-montage'));
export default function PickupThumbnail({entry,art,name,locale,priority=false}:{entry:Entry;art?:EntityArtwork;name:Localized;locale:Locale;priority?:boolean}){
 const members=thumbnailMembers(entry,name),selected=art&&artworkForLocale(art,locale,'full',serviceArtworkLocale(entry.region,entry.gameId));
 return <span className="pickup-thumbnail">{members.length>1?<Suspense fallback={<span className="pickup-montage-wait"/>}><Montage entry={entry} membersOverride={members} locale={locale} priority={priority} thumbnail fill/></Suspense>:selected?.image?<ThumbnailImage src={selected.image} alt={name[locale]||name.en} head={pickupThumbnailHead(entry.gameId,selected)} focus={selected.previewFocus} frame={pickupThumbnailFrame(selected)} priority={priority}/>:<span className="thumbnail-missing"><ImageOff size={22}/></span>}</span>;
}
