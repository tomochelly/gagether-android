'use client';
import type {Entry,Locale} from '@/lib/types';
import {pickupArtwork} from '@/lib/pickup-artwork';
import {serviceArtworkLocale} from '@/lib/artwork';
import {localizedName} from '@/lib/presentation';
import ArtworkMedia from './artwork-media';
export default function PickupPortraits({entry,locale}:{entry:Entry;locale:Locale}){
 const images=pickupArtwork(entry,locale);if(!images.length)return null;
 return <span className="pickup-portraits">{images.map(({name,art},i)=><span className="pickup-portrait" key={art.image+':'+i}><ArtworkMedia art={art} alt={localizedName(name,locale)} locale={locale} serviceLocale={serviceArtworkLocale(entry.region,entry.gameId)} mode="preview"/><small>{localizedName(name,locale)}</small></span>)}</span>;
}
